import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import { useAuthStore } from "./stores/useAuthStore";
import Loading from "./components/Loading";
import AdminPage from "./pages/AdminPage";

const AuthWrapper = ({ children }) => {
  const { checkAuth, checkingAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/" && location.pathname !== "/signup") {
      checkAuth();
    } else {
      useAuthStore.setState({ checkingAuth: false });
    }
  }, [location.pathname]);

  if (checkingAuth) {
    return <Loading />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <AuthWrapper>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/adminpage" element={<AdminPage />} />
        </Routes>
      </AuthWrapper>
    </Router>
  );
};

export default App;
