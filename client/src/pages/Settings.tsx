import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Bell, 
  Palette, 
  Globe, 
  Shield, 
  Trash2,
  Save,
  Youtube,
  Settings as SettingsIcon,
  Unlink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import { youtubeService } from '@/services/youtubeService';
import { useChannelConnections } from '@/hooks/useChannelConnections';
import { ChannelConnectionsList } from '@/components/ui/channel-connections-list';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    analytics: boolean;
    trends: boolean;
  };
  language: string;
  timezone: string;
  privacy: {
    publicProfile: boolean;
    showStats: boolean;
    allowMessages: boolean;
  };
}

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Use the new custom hook for channel connections
  const {
    connections: channelConnections,
    loading: connectionsLoading,
    connecting,
    connectChannel,
    disconnectChannel,
    refreshConnection
  } = useChannelConnections();
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      analytics: true,
      trends: false,
    },
    language: 'en',
    timezone: 'UTC',
    privacy: {
      publicProfile: false,
      showStats: true,
      allowMessages: true,
    },
  });
  const [profileData, setProfileData] = useState({
    displayName: user?.user_metadata?.display_name || '',
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
  });

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Try to load preferences from user metadata or database
      const savedPreferences = currentUser.user_metadata?.preferences;
      if (savedPreferences) {
        setPreferences({ ...preferences, ...savedPreferences });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        display_name: profileData.displayName,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key: keyof UserPreferences['notifications'], value: boolean) => {
    const updated = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    };
    setPreferences(updated);
    await savePreferences(updated);
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    const updated = { ...preferences, theme };
    setPreferences(updated);
    await savePreferences(updated);
  };

  const handlePrivacyChange = async (key: keyof UserPreferences['privacy'], value: boolean) => {
    const updated = {
      ...preferences,
      privacy: {
        ...preferences.privacy,
        [key]: value,
      },
    };
    setPreferences(updated);
    await savePreferences(updated);
  };

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { preferences: newPreferences }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save preferences.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectChannel = async (connectionId: string) => {
    await disconnectChannel(connectionId);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // First disconnect all channels
      for (const connection of channelConnections) {
        await youtubeService.disconnectAccount(connection.id);
      }

      // Then delete user account
      const { error } = await supabase.auth.admin.deleteUser(user!.id);
      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed. Please contact support if needed.
                  </p>
                </div>
                <Button onClick={handleProfileSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <ChannelConnectionsList
              connections={channelConnections}
              onConnect={connectChannel}
              onDisconnect={handleDisconnectChannel}
              onRefresh={refreshConnection}
              loading={connectionsLoading || connecting}
              title="Connected Accounts"
              showAddButton={false}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about analytics changes</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.analytics}
                    onCheckedChange={(checked) => handleNotificationChange('analytics', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trending Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified about trending opportunities</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.trends}
                    onCheckedChange={(checked) => handleNotificationChange('trends', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Theme</Label>
                  <Select value={preferences.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Language</Label>
                  <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-muted-foreground">Make your profile visible to others</p>
                  </div>
                  <Switch
                    checked={preferences.privacy.publicProfile}
                    onCheckedChange={(checked) => handlePrivacyChange('publicProfile', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Statistics</Label>
                    <p className="text-sm text-muted-foreground">Display your channel statistics publicly</p>
                  </div>
                  <Switch
                    checked={preferences.privacy.showStats}
                    onCheckedChange={(checked) => handlePrivacyChange('showStats', checked)}
                  />
                </div>
                <Separator />
                <div className="pt-6">
                  <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                  <Card className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Delete Account</h4>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all associated data
                          </p>
                        </div>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
