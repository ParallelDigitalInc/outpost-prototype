import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAppStore } from "./state";
import { CallPage, CallReturnLifecycle } from "./components/CallStandIn";
import { DesktopPreview } from "./components/DesktopPreview";
import { PageTransition } from "./components/PageTransition";
import { SplashPage, SignInPage, VerifyPage } from "./pages/Auth";
import { HomePage } from "./pages/Home";
import { SearchPage } from "./pages/Search";
import { MentorsPage } from "./pages/Mentors";
import { MentorDetailPage } from "./pages/MentorDetail";
import { BookingPage, BookingLifecycle } from "./pages/Booking";
import { SessionsPage, SessionDetailPage } from "./pages/Sessions";
import {
  OpportunitiesPage,
  OpportunitySearchPage,
  DemoDaysPage,
  ApplicationReturnPrompt,
} from "./pages/Opportunities";
import { KeyboardViewport } from "./components/KeyboardViewport";
import {
  OpportunityDetailPage,
  ApplicationSavedPage,
} from "./pages/OpportunityDetail";
import { SavedPage } from "./pages/Saved";
import { ProfilePage, ProfileEditPage } from "./pages/Profile";
export function App() {
  const { signedIn } = useAppStore();
  const location = useLocation();
  const auth = ["/splash", "/sign-in", "/verify"].includes(location.pathname);
  return (
    <>
      <KeyboardViewport />
      <input
        id="keyboard-bridge"
        className="keyboard-bridge"
        type="search"
        enterKeyHint="search"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Search"
      />
      <div className="phone-frame">
        <PageTransition>
          {!signedIn && !auth ? (
            <Navigate to="/splash" replace />
          ) : signedIn && auth ? (
            <Navigate to="/home" replace />
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate to={signedIn ? "/home" : "/splash"} replace />
                }
              />
              <Route path="/splash" element={<SplashPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/mentors" element={<MentorsPage />} />
              <Route path="/mentors/ask" element={<MentorsPage />} />
              <Route path="/mentors/:id" element={<MentorDetailPage />} />
              <Route path="/mentors/:id/book" element={<BookingPage />} />
              <Route path="/mentors/:id/review" element={<BookingPage />} />
              <Route path="/mentors/:id/requested" element={<BookingPage />} />
              <Route path="/call/:id" element={<CallPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/sessions/:id" element={<SessionDetailPage />} />
              <Route
                path="/sessions/:id/after"
                element={<SessionDetailPage />}
              />
              <Route
                path="/challenges"
                element={<OpportunitiesPage kind="challenges" />}
              />
              <Route
                path="/challenges/ask"
                element={<OpportunitySearchPage kind="challenges" />}
              />
              <Route path="/challenges/demo-days" element={<DemoDaysPage />} />
              <Route
                path="/challenges/:id"
                element={<OpportunityDetailPage kind="challenges" />}
              />
              <Route
                path="/grants"
                element={<OpportunitiesPage kind="grants" />}
              />
              <Route
                path="/grants/ask"
                element={<OpportunitySearchPage kind="grants" />}
              />
              <Route
                path="/grants/:id"
                element={<OpportunityDetailPage kind="grants" />}
              />
              <Route
                path="/challenges/:id/application-saved"
                element={<ApplicationSavedPage kind="challenges" />}
              />
              <Route
                path="/grants/:id/application-saved"
                element={<ApplicationSavedPage kind="grants" />}
              />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:section" element={<ProfileEditPage />} />
              <Route
                path="*"
                element={
                  <Navigate to={signedIn ? "/home" : "/splash"} replace />
                }
              />
            </Routes>
          )}
        </PageTransition>
      </div>
      {signedIn && (
        <>
          {!location.pathname.startsWith("/call/") && (
            <>
              <BookingLifecycle />
              <CallReturnLifecycle />
            </>
          )}
          <ApplicationReturnPrompt />
        </>
      )}
      {!location.pathname.startsWith("/call/") && <DesktopPreview />}
    </>
  );
}
