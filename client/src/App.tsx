import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// Layouts
import ConsultancyLayout from './layouts/ConsultancyLayout';
import StudentLayout from './layouts/StudentLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Activate from './pages/auth/Activate';
import RegisterConsultancy from './pages/auth/RegisterConsultancy';

// Consultancy pages
import ConsultancyDashboard from './pages/consultancy/Dashboard';
import Kanban from './pages/consultancy/Kanban';
import Clients from './pages/consultancy/Clients';
import ClientDetail from './pages/consultancy/ClientDetail';
import Documents from './pages/consultancy/Documents';
import Leads from './pages/consultancy/Leads';
import DailyTasks from './pages/consultancy/DailyTasks';
import Colleges from './pages/consultancy/Colleges';
import OSHC from './pages/consultancy/OSHC';
import TrustLedger from './pages/consultancy/TrustLedger';
import Sponsors from './pages/consultancy/Sponsors';
import ConsultancyProfile from './pages/consultancy/Profile';
import ConsultancySettings from './pages/consultancy/Settings';
import ClientEnroll from './pages/consultancy/ClientEnroll';
import Employees from './pages/consultancy/Employees';
import EmployeeDetail from './pages/consultancy/EmployeeDetail';
import TraceHistory from './pages/consultancy/TraceHistory';
import Attendance from './pages/consultancy/Attendance';
import LeadForm from './pages/consultancy/LeadForm';
import LeadDetail from './pages/consultancy/LeadDetail';
import ClientEdit from './pages/consultancy/ClientEdit';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentDocuments from './pages/student/Documents';
import PRCalculator from './pages/student/PRCalculator';
import MigrationCompass from './pages/student/MigrationCompass';
import ConsultancySearch from './pages/student/ConsultancySearch';
import VisaRoadmap from './pages/student/VisaRoadmap';
import StudentApplications from './pages/student/Applications';
import StudentTasks from './pages/student/Tasks';

// Super Admin
import SuperDashboard from './pages/super/Dashboard';
import SuperConsultancies from './pages/super/Consultancies';
import ConsultancyDetail from './pages/super/ConsultancyDetail';
import ConsultancyForm from './pages/super/ConsultancyForm';
import SuperUsers from './pages/super/Users';
import SuperTraceHistory from './pages/super/TraceHistory';

// Landing
import Landing from './pages/Landing';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-consultancy" element={<RegisterConsultancy />} />
      <Route path="/activate" element={<Activate />} />

      <Route path="/consultancy" element={<ProtectedRoute roles={['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN']}><ConsultancyLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ConsultancyDashboard />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/enroll" element={<ClientEnroll />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="clients/:id/edit" element={<ClientEdit />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="trace-history" element={<TraceHistory />} />
        <Route path="documents" element={<Documents />} />
        <Route path="templates" element={<Navigate to="documents" replace />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/add" element={<LeadForm />} />
        <Route path="leads/:id/edit" element={<LeadForm />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="daily-tasks" element={<DailyTasks />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="colleges" element={<Colleges />} />
        <Route path="oshc" element={<OSHC />} />
        <Route path="trust" element={<TrustLedger />} />
        <Route path="sponsors" element={<Sponsors />} />
        <Route path="profile" element={<ConsultancyProfile />} />
        <Route path="settings" element={<ConsultancySettings />} />
      </Route>

      <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><StudentLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="tasks" element={<StudentTasks />} />
        <Route path="documents" element={<StudentDocuments />} />
        <Route path="calculator" element={<PRCalculator />} />
        <Route path="compass" element={<MigrationCompass />} />
        <Route path="consultancies" element={<ConsultancySearch />} />
        <Route path="roadmap" element={<VisaRoadmap />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperDashboard />} />
        <Route path="consultancies" element={<SuperConsultancies />} />
        <Route path="consultancies/add" element={<ConsultancyForm />} />
        <Route path="consultancies/:id/edit" element={<ConsultancyForm />} />
        <Route path="consultancies/:id" element={<ConsultancyDetail />} />
        <Route path="users" element={<SuperUsers />} />
        <Route path="trace-history" element={<SuperTraceHistory />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
