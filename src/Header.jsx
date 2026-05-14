import { APP_LOGO_URL } from './utilities/constants';
import { Link } from 'react-router-dom';

const Header = () => {

  return (
    <div className='flex flex-wrap justify-between border border-gray-600 rounded-lg mx-1 bg-green-50 shadow-lg'>
      <div>
        <img className='w-16 m-4 rounded-lg' src={APP_LOGO_URL} alt='app_logo' />
      </div>
      <nav className='m-2'>
        <ul className='flex flex-wrap m-3 p-4 font-semibold text-lg text-slate-600'>
          <li className='mr-4'><Link to="/">Home</Link></li>
          <li className='mr-4'><Link to="/about">About</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Header;