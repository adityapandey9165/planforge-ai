import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import OutputView from "./pages/OutputView";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/create", element: <CreateProject /> },
  { path: "/output", element: <OutputView /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}