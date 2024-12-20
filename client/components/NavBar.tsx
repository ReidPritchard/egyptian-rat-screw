import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { ApplicationStore, useApplicationStore } from '../hooks/useApplicationStore';
import { useLobbyStore } from '../hooks/useLobbyStore';

const logo = './assets/rat.png';
const title = './assets/title.png';

export const NavBar: React.FC = () => {
  const { handleJoinLobby } = useLobbyStore();
  const { userLocation } = useApplicationStore();

  return (
    <div className="navbar bg-base-100 rounded-b-lg">
      <div className="navbar-start">
        <div className="">
          <img src={title} className="image-rendering-pixelated" alt="'Rat Slap' in a pixelated style" />
        </div>
      </div>
      <div className="navbar-center flex-1">
        {/* <div className="form-control">
          <input type="text" placeholder="Enter Game Code" className="input input-bordered w-24 md:w-auto" />
        </div> */}
      </div>
      <div className="navbar-end">
        <ThemeToggle />

        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-full">
              <img alt="A pixelated rat" src={logo} className="w-full image-rendering-pixelated aspect-ratio-[4/3]" />
            </div>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            {/* <li>
              <a className="justify-between">
                Profile
                <span className="badge badge-primary">New</span>
              </a>
            </li> */}
            <li>
              <a>Settings</a>
            </li>
            {userLocation === 'game' && (
              <li>
                <button className="btn btn-ghost btn-sm" onClick={handleJoinLobby}>
                  Leave Game
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
