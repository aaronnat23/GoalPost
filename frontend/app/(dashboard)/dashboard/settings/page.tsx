import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              defaultValue={user.name || ''}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user.email}
              disabled
            />
            <p className="text-xs text-gray-500">
              Email cannot be changed
            </p>
          </div>
          <Button disabled>Save Changes (Coming Soon)</Button>
        </CardContent>
      </Card>

      {/* Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Manage your organizations and teams</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.ownedOrgs.map((org) => (
            <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-gray-500">Owner</div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Manage
              </Button>
            </div>
          ))}
          {user.orgMemberships.map((membership) => (
            <div key={membership.org.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">{membership.org.name}</div>
                <div className="text-sm text-gray-500">{membership.role}</div>
              </div>
              <Button variant="outline" size="sm" disabled>
                View
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Password and authentication settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Change Password (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
