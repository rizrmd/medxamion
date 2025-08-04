import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocal } from "@/lib/hooks/use-local";

export default function TestSessionPage() {
  const { user, session, isAuthenticated, logout } = useAuth();
  const local = useLocal({
    wsStatus: "Disconnected",
    messages: [] as string[]
  });

  const addMessage = (message: string) => {
    local.messages.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    if (local.messages.length > 10) {
      local.messages.shift();
    }
    local.render();
  };

  const testLogin = async () => {
    addMessage("Opening new window to test login...");
    window.open("/auth/login", "_blank");
  };

  if (!isAuthenticated()) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Test Single Device Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to be logged in to test this feature.</p>
            <Button onClick={() => window.location.href = "/auth/login"}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Single Device Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Session Info:</h3>
            <div className="bg-gray-100 p-3 rounded space-y-1">
              <p><strong>User:</strong> {user?.username || user?.email}</p>
              <p><strong>User Type:</strong> {user?.user_type}</p>
              <p><strong>Session Token:</strong> {session?.token?.substring(0, 10)}...</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the button below to open a new login window</li>
              <li>Login with the same account in the new window</li>
              <li>This window should automatically log out and redirect to login page</li>
            </ol>
          </div>

          <div className="flex gap-4">
            <Button onClick={testLogin} variant="default">
              Open New Login Window
            </Button>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">WebSocket Messages:</h3>
            <div className="bg-gray-100 p-3 rounded h-48 overflow-y-auto">
              {local.messages.length === 0 ? (
                <p className="text-gray-500">No messages yet...</p>
              ) : (
                local.messages.map((msg, idx) => (
                  <p key={idx} className="text-sm font-mono">{msg}</p>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}