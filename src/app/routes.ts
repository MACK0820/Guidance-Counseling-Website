import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { CounselorDashboard } from "./pages/CounselorDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import { FirstTimeStudentSetup } from "./pages/FirstTimeStudentSetup";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/student/setup",
    Component: FirstTimeStudentSetup,
  },
  {
    path: "/student/dashboard",
    Component: StudentDashboard,
  },
  {
    path: "/counselor/dashboard",
    Component: CounselorDashboard,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/superadmin/dashboard",
    Component: SuperAdminDashboard,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
