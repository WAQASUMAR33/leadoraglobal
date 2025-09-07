import { UserProvider } from "../../lib/userContext";

export default function SignupLayout({ children }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
