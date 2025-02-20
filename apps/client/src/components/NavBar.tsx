import { useApi } from "@/contexts/ApiContext";
import type React from "react";
import { useApplicationStore } from "../store/useApplicationStore";
import { useLobbyStore } from "../store/useLobbyStore";
import { ThemeToggle } from "./ThemeToggle";

const logo = "./assets/rat.png";
const title = "./assets/title.png";

export const NavBar: React.FC = () => {
  const { handleJoinLobby } = useLobbyStore();
  const { userLocation } = useApplicationStore();
  const api = useApi();

  return (
    <div className="navbar bg-base-100 rounded-b-lg">
      <div className="navbar-start">
        <div className="">
          <img
            src={title}
            className="image-rendering-pixelated"
            alt="'Rat Slap' in a pixelated style"
          />
        </div>
      </div>
      <div className="navbar-center flex-1" />
      <div className="navbar-end">
        <ThemeToggle />

        <div className="dropdown dropdown-end">
          <button type="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-full">
              <img
                alt="A pixelated rat"
                src={logo}
                className="w-full image-rendering-pixelated aspect-ratio-[4/3]"
              />
            </div>
          </button>
          <ul className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            {/* <li>
              <a className="justify-between">
                Profile
                <span className="badge badge-primary">New</span>
              </a>
            </li> */}
            <li>
              {/* <a href="/settings">Settings</a> */}
              <button type="button" className="btn btn-ghost btn-sm">
                Settings
              </button>
            </li>
            {userLocation === "game" && (
              <li>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => api && handleJoinLobby(api)}
                >
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
