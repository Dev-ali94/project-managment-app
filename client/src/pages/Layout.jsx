import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadTheme } from '../features/themeSlice';
import { Loader2Icon } from 'lucide-react';
import { useUser, SignIn, useAuth, CreateOrganization, useOrganizationList } from '@clerk/clerk-react';
import { fetchWorkspace } from '../features/workspaceSlice';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { loading, workspaces} = useSelector((state) => state.workspace);
  const dispatch = useDispatch();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Initial load of theme
  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  // Fetch workspaces once user is loaded
  useEffect(() => {
    if (isLoaded && user) {
      dispatch(fetchWorkspace({ getToken }))
        .finally(() => {
          setInitialLoad(false);
        });
    }
  }, [isLoaded, user]);

  // Show loading while checking authentication or initial load
  if (!isLoaded || initialLoad) {
    return (
      <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  // If no user, show sign in
  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
        <SignIn />
      </div>
    );
  }

  // If user exists and workspaces are loaded but empty, show create organization
  if (user && isLoaded &&  workspaces.length === 0) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-4'>
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Create Your First Workspace</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to create a workspace to get started with the application.
          </p>
          <CreateOrganization 
            afterCreateOrganizationUrl="/"
            skipInvitationScreen={true}
            afterCreateOrganization={() => {
              dispatch(fetchWorkspace({ getToken }));
            }}
          />
        </div>
      </div>
    );
  }

  // Main app layout - user is logged in and has organizations
  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;