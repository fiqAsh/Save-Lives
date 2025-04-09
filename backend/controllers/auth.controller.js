import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

//ar
//this is for generating access token and refresh token
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "30m",
    }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return { accessToken, refreshToken };
};
//ar
//this is for setting cookies in the browser
const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 30 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });
};
//ar
export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      bloodGroup,
      mobile,
      gender,
      age,
      weight,
      height,
      latitude,
      longitude,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      bloodGroup,
      mobile,
      gender,
      age,
      weight,
      height,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    const { accessToken, refreshToken } = generateTokens(newUser);

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: "User created successfully",
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};
//ar
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    setCookies(res, accessToken, refreshToken);

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
//ar
export const logout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};
//hjb
export const getUserProfile = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get user profile", error: error.message });
  }
};
//ar
export const getAllUser = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get users", error: error.message });
  }
};

//hjb
export const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      email,
      password,
      bloodGroup,
      mobile,
      gender,
      age,
      weight,
      height,
      latitude,
      longitude,
    } = req.body;

    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let hashedPassword = user.password;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.password = hashedPassword;
    user.bloodGroup = bloodGroup || user.bloodGroup;
    user.mobile = mobile || user.mobile;
    user.gender = gender || user.gender;
    user.age = age || user.age;
    user.weight = weight || user.weight;
    user.height = height || user.height;

    // Update location only if both latitude and longitude are provided and valid
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      latitude !== null &&
      longitude !== null
    ) {
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    await user.save();

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

//ar
//this is for refreshing access tokens automatically when it expires
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const accessToken = jwt.sign(
          { id: user._id },
          process.env.JWT_ACCESS_SECRET,
          { expiresIn: "15m" }
        );

        res.cookie("accessToken", accessToken, {
          maxAge: 1000 * 60 * 15,
          httpOnly: true,
        });

        res.json({ accessToken });
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
