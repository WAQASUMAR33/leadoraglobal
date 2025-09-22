import { UserProvider } from "../../lib/userContext";

export default function LoginLayout({ children }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
