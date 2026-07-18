import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SetBudget from "./pages/SetBudget";
import Dashboard from "./pages/Dashboard";
import LogExpense from "./pages/LogExpense";
import History from "./pages/History";
import Insights from "./pages/Insights";
import ChatWidget from "./components/ChatWidget";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/set-budget"
            element={
              <ProtectedRoute>
                <SetBudget />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log-expense"
            element={
              <ProtectedRoute>
                <LogExpense />
              </ProtectedRoute>
            }
          />
         
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                  path="/insights"
                  element={
                    <ProtectedRoute>
                      <Insights />
                    </ProtectedRoute>
                  }
                />
              
        </Routes>
     
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;