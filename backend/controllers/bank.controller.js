import Bank from "../models/bank.model.js";
import BankRequest from "../models/bankrequest.model.js";
import { sendAdminNotification } from "./notification.controller.js";

//request related to banks that the user makes
//raz m3
export const createBankRequest = async (req, res) => {
  try {
    const { bank, bloodgroup, quantity, location } = req.body;

    const bankDoc = await Bank.findOne({ name: bank });

    if (!bankDoc) {
      return res.status(404).json({ message: "Bank not found" });
    }

    const newBankRequest = await BankRequest.create({
      bank: bankDoc._id,
      bloodgroup,
      quantity,
      location,

      user: req.user._id,
    });

    await sendAdminNotification(newBankRequest);

    res
      .status(200)
      .json({ message: "Bank request created successfully", newBankRequest });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create bank request", error: error.message });
  }
};

//admin handles these parts
//ar
export const getAllBankRequests = async (req, res) => {
  try {
    const requests = await BankRequest.find().populate("bank", "name");
    res.status(200).json(requests);
    console.log(requests);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bank requests", error: error.message });
  }
};

//hjb m2
export const getAllBankData = async (req, res) => {
  try {
    const bankData = await Bank.find();
    res.status(200).json(bankData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bank data", error: error.message });
  }
};
