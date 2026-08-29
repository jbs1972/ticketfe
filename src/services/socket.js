import { io } from "socket.io-client";
import { getToken } from "../utilities/tokenStorage";

const socket = io("http://localhost:3001", {
  autoConnect: true,
});

const authenticate = () => {
  const token = getToken();
  if (token) socket.emit("authenticate", token);
};

// Handles the normal case: token already exists when the socket connects (page refresh).
socket.on("connect", authenticate);

// Exported so the login flow can call this right after storing a fresh token,
// covering the case where the socket connected before the user logged in.
export const reauthenticateSocket = authenticate;

export default socket;
