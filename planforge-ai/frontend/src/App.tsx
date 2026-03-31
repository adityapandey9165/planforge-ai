import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import OutputView from "./pages/OutputView";
import Settings from "./pages/Settings";  // ← add this

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/create", element: <CreateProject /> },
  { path: "/output", element: <OutputView /> },
  { path: "/settings", element: <Settings /> },  // ← add this
]);

export default function App() {
  return <RouterProvider router={router} />;
}