import { Link, NavLink, Outlet } from 'react-router-dom';
import { useRandomLogo } from '../utils/logoUtils';
import { Button } from './ui';

function Layout() {
  const currentLogo = useRandomLogo();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-primary-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center hover:opacity-80 transition-opacity bg-secondary/30 p-2"
            >
              <img
                src={currentLogo}
                alt="Glenn L. Pearson Papers"
                className="h-32 w-auto"
              />
            </Link>
            <nav className="flex gap-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? 'text-secondary-500 font-semibold transition-colors'
                    : 'hover:text-secondary-300 transition-colors font-medium'
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/browse"
                className={({ isActive }) =>
                  isActive
                    ? 'text-secondary-300 font-semibold transition-colors'
                    : 'hover:text-secondary-300 transition-colors font-medium'
                }
              >
                Browse
              </NavLink>
              <NavLink
                to="/timeline"
                className={({ isActive }) =>
                  isActive
                    ? 'text-secondary-300 font-semibold transition-colors'
                    : 'hover:text-secondary-300 transition-colors font-medium'
                }
              >
                Timeline
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive
                    ? 'text-secondary-300 font-semibold transition-colors'
                    : 'hover:text-secondary-300 transition-colors font-medium'
                }
              >
                About
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary-700 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-8">
          <div className="flex gap-8">
            <div className="flex-grow">
              <div className="flex items-center mb-3 bg-secondary/30 p-3 rounded-lg max-w-sm">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <img
                    src={currentLogo}
                    alt="Glenn L. Pearson Papers"
                    className="h-32 w-auto"
                  />
                </Link>
                <Link to="/about" className="font-semibold">
                  About This Archive
                </Link>
              </div>
              <p className="text-sm text-white/80 pl-8">
                Preserving the writings of Glenn L. Pearson.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Contact</h3>
              <p className="text-sm text-white/80">
                Questions about this archive? Contact the family.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 text-center text-sm text-white/60">
            <p>
              &copy; {new Date().getFullYear()} Glenn L. Pearson Papers All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
