import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import Login from "./pages/Login";
import Signup from "@/pages/Signup";
import Home from "@/pages/Home";
import Credits from "./pages/Credits";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);

      // Set up auth subscription
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
    };

    getSession();
  }, []);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen bg-background'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
      <div className='min-h-screen'>
        <Router>
          <Routes>
            <Route
              path='/login'
              element={!session ? <Login /> : <Navigate to='/' />}
            />
            <Route
              path='/credits'
              element={session ? <Credits /> : <Navigate to='/login' />}
            />
            <Route
              path='/'
              element={session ? <Home /> : <Navigate to='/login' />}
            />
            <Route
              path='/signup'
              element={!session ? <Signup /> : <Navigate to='/' />}
            />
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
