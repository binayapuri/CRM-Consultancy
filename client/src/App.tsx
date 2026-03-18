import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { getDashboardPathForRole } from './lib/authHelpers';

// Layouts
import ConsultancyLayout from './layouts/ConsultancyLayout';
import StudentLayout from './layouts/StudentLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import PartnerLayout from './layouts/PartnerLayout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Activate from './pages/auth/Activate';
import RegisterConsultancy from './pages/auth/RegisterConsultancy';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/AuthCallback';

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
import OfferLetters from './pages/student/OfferLetters';
import StudentInsurance from './pages/student/Insurance';
import VisaGuide from './pages/student/VisaGuide';
import Journey from './pages/student/Journey';
import Settings from './pages/student/Settings';
import CVGenerator from './pages/student/CVGenerator';
import StudentApplications from './pages/student/Applications';
import StudentTasks from './pages/student/Tasks';
import Community from './pages/student/Community';
import Jobs from './pages/student/Jobs';
import News from './pages/student/News';
import NewsDetail from './pages/student/NewsDetail';
import Bookings from './pages/student/Bookings';
import InvoicesPage from './pages/student/Invoices';

// Super Admin
import SuperDashboard from './pages/super/Dashboard';
import SuperConsultancies from './pages/super/Consultancies';
import ConsultancyDetail from './pages/super/ConsultancyDetail';
import ConsultancyForm from './pages/super/ConsultancyForm';
import SuperUsers from './pages/super/Users';
import SuperTraceHistory from './pages/super/TraceHistory';
import Verifications from './pages/super/Verifications';
import Universities from './pages/super/Universities';
import AdminAdvancedSettings from './pages/super/AdminAdvancedSettings';
import AdminNewsManager from './pages/super/AdminNewsManager';
import AdminNewsForm from './pages/super/AdminNewsForm';
import AdminStudentManager from './pages/super-admin/StudentManager';

// Partner
import UniversityApplications from './pages/partner/UniversityApplications';
import InsuranceDashboard from './pages/partner/InsuranceDashboard';
import EmployerDashboard from './pages/partner/EmployerDashboard';

// Sponsor
import SponsorLayout from './layouts/SponsorLayout';
import SponsorDashboard from './pages/sponsor/Dashboard';
import SponsorDocuments from './pages/sponsor/Documents';
import SponsorCompanyInfo from './pages/sponsor/CompanyInfo';

// Landing
import Landing from './pages/Landing';
import PublicNews from './pages/public/PublicNews';
import PublicNewsDetail from './pages/public/PublicNewsDetail';

// Global UI
import { ToastContainer, Modal, ConfirmDialog } from './components/ui';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  if (token && user) return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <Modal />
      <ConfirmDialog />
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/news" element={<PublicNews />} />
      <Route path="/news/:slug" element={<PublicNewsDetail />} />
      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPassword /></GuestOnlyRoute>} />
      <Route path="/reset-password" element={<GuestOnlyRoute><ResetPassword /></GuestOnlyRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route path="/register-consultancy" element={<GuestOnlyRoute><RegisterConsultancy /></GuestOnlyRoute>} />
      <Route path="/activate" element={<GuestOnlyRoute><Activate /></GuestOnlyRoute>} />

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
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="calculator" element={<PRCalculator />} />
        <Route path="compass" element={<MigrationCompass />} />
        <Route path="community" element={<Community />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="news" element={<News />} />
        <Route path="news/:slug" element={<NewsDetail />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="offer-letters" element={<OfferLetters />} />
        <Route path="insurance" element={<StudentInsurance />} />
        <Route path="consultancies" element={<ConsultancySearch />} />
        <Route path="visa-guide" element={<VisaGuide />} />
        <Route path="roadmap" element={<VisaGuide />} />
        <Route path="journey" element={<Journey />} />
        <Route path="settings" element={<Settings />} />
        <Route path="cv" element={<CVGenerator />} />
      </Route>

      <Route path="/sponsor" element={<ProtectedRoute roles={['SPONSOR']}><SponsorLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SponsorDashboard />} />
        <Route path="documents" element={<SponsorDocuments />} />
        <Route path="company" element={<SponsorCompanyInfo />} />
      </Route>

      <Route path="/partner" element={<ProtectedRoute roles={['UNIVERSITY_PARTNER', 'INSURANCE_PARTNER', 'EMPLOYER']}><PartnerLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="applications" replace />} />
        <Route path="dashboard" element={<Navigate to="applications" replace />} />
        <Route path="applications" element={<UniversityApplications />} />
        <Route path="insurance" element={<InsuranceDashboard />} />
        <Route path="jobs" element={<EmployerDashboard />} />
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
        <Route path="verifications" element={<Verifications />} />
        <Route path="universities" element={<Universities />} />
        <Route path="students" element={<AdminStudentManager />} />
        <Route path="news" element={<AdminNewsManager />} />
        <Route path="news/add" element={<AdminNewsForm />} />
        <Route path="news/:id/edit" element={<AdminNewsForm />} />
        <Route path="settings" element={<AdminAdvancedSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
