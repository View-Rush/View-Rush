import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Link as LinkIcon,
  Camera,
  Shield,
  Key,
  Bell,
  Trash2,
  Download,
  Upload,
  Youtube
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import { storageService } from '@/services/storage';
import { youtubeService, YouTubeConnectionStatus } from '@/services/youtube';
import Header from '@/components/layout/Header';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  website: string;
  location: string;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  phone: string;
  social_links: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  preferences: {
    newsletter: boolean;
    marketing_emails: boolean;
    security_alerts: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  stats: {
    total_videos: number;
    total_views: number;
    total_subscribers: number;
    join_date: string;
  };
}

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [youtubeConnection, setYoutubeConnection] = useState<YouTubeConnectionStatus>({ isConnected: false });
  const [connectingYouTube, setConnectingYouTube] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadYouTubeConnection();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let profileData = null;
      try {
        const userData = await authService.getUser();
        profileData = userData.user;
      } catch (error) {
        console.log('Profile not found, using defaults');
      }
      
      // Mock additional profile data
      const mockProfile: UserProfile = {
        id: profileData?.id || user?.id || '',
        email: profileData?.email || user?.email || '',
        full_name: profileData?.user_metadata?.full_name || profileData?.user_metadata?.display_name || 'John Doe',
        username: profileData?.user_metadata?.username || 'johndoe',
        bio: profileData?.user_metadata?.bio || 'Content creator passionate about technology and education.',
        avatar_url: profileData?.user_metadata?.avatar_url || '',
        website: profileData?.user_metadata?.website || 'https://johndoe.com',
        location: profileData?.user_metadata?.location || 'San Francisco, CA',
        created_at: profileData?.created_at || '2024-01-15T10:00:00Z',
        updated_at: profileData?.updated_at || new Date().toISOString(),
        email_verified: true,
        phone: '+1 (555) 123-4567',
        social_links: {
          twitter: 'https://twitter.com/johndoe',
          instagram: 'https://instagram.com/johndoe',
          linkedin: 'https://linkedin.com/in/johndoe',
          youtube: 'https://youtube.com/@johndoe'
        },
        preferences: {
          newsletter: true,
          marketing_emails: false,
          security_alerts: true,
          theme: 'system',
          language: 'en'
        },
        stats: {
          total_videos: 45,
          total_views: 2450000,
          total_subscribers: 12500,
          join_date: '2024-01-15'
        }
      };
      
      setProfile(mockProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      await authService.updateProfile({
        display_name: profile.full_name,
        metadata: {
          username: profile.username,
          bio: profile.bio,
          website: profile.website,
          location: profile.location,
          phone: profile.phone
        }
      });

      // Update preferences in storage
      storageService.updateUserPreferences(profile.preferences);
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.new.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      await authService.updatePassword({
        password: passwordData.current,
        newPassword: passwordData.new
      });
      setPasswordData({ current: '', new: '', confirm: '' });
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error updating password",
        description: "Failed to update password. Please check your current password.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = () => {
    toast({
      title: "Coming soon",
      description: "Avatar upload functionality will be available soon.",
    });
  };

  const handleExportData = () => {
    if (!profile) return;
    
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: "Your profile data has been exported successfully.",
    });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;

    try {
      // For now, just sign out - delete functionality would need backend support
      await authService.signOut();
      toast({
        title: "Account deletion initiated",
        description: "Please contact support to complete account deletion.",
      });
    } catch (error) {
      console.error('Error initiating account deletion:', error);
      toast({
        title: "Error",
        description: "Failed to initiate account deletion. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const loadYouTubeConnection = () => {
    const connection = youtubeService.getConnectionStatus();
    setYoutubeConnection(connection);
  };

  const handleConnectYouTube = async () => {
    setConnectingYouTube(true);
    try {
      await youtubeService.connectAccount();
      loadYouTubeConnection(); // Reload connection status
    } catch (error) {
      console.error('YouTube connection error:', error);
    } finally {
      setConnectingYouTube(false);
    }
  };

  const handleDisconnectYouTube = async () => {
    try {
      await youtubeService.disconnectAccount();
      loadYouTubeConnection(); // Reload connection status
    } catch (error) {
      console.error('YouTube disconnection error:', error);
    }
  };

  const handleSyncYouTube = async () => {
    try {
      await youtubeService.syncChannelData();
      loadYouTubeConnection(); // Reload connection status
    } catch (error) {
      console.error('YouTube sync error:', error);
    }
  };

  if (loading || !profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>
                        {profile.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8"
                        onClick={handleAvatarUpload}
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    {profile.email_verified && (
                      <Badge variant="secondary" className="mt-1">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{profile.stats.total_subscribers.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Subscribers</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{profile.stats.total_views.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{profile.stats.total_videos}</div>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profile.stats.join_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={profile.social_links.twitter || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      social_links: { ...profile.social_links, twitter: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={profile.social_links.instagram || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      social_links: { ...profile.social_links, instagram: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={profile.social_links.linkedin || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      social_links: { ...profile.social_links, linkedin: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={profile.social_links.youtube || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      social_links: { ...profile.social_links, youtube: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="https://youtube.com/@username"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* YouTube Tab */}
        <TabsContent value="youtube" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                YouTube Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {youtubeConnection.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <Youtube className="h-8 w-8 text-red-600" />
                      <div>
                        <h4 className="font-medium text-green-800">YouTube Connected</h4>
                        <p className="text-sm text-green-600">
                          {youtubeConnection.channel?.title || 'YouTube Channel'}
                        </p>
                        {youtubeConnection.lastSync && (
                          <p className="text-xs text-green-500">
                            Last synced: {new Date(youtubeConnection.lastSync).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleSyncYouTube}
                        size="sm"
                      >
                        Sync Data
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleDisconnectYouTube}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        size="sm"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                  
                  {youtubeConnection.channel && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {parseInt(youtubeConnection.channel.statistics.subscriberCount).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Subscribers</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {parseInt(youtubeConnection.channel.statistics.viewCount).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {youtubeConnection.channel.statistics.videoCount}
                        </div>
                        <p className="text-sm text-muted-foreground">Videos</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Youtube className="h-8 w-8 text-red-600" />
                    <div>
                      <h4 className="font-medium">Connect YouTube Channel</h4>
                      <p className="text-sm text-muted-foreground">
                        Connect your YouTube channel to import analytics and insights
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleConnectYouTube} 
                    disabled={connectingYouTube}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {connectingYouTube ? 'Connecting...' : 'Connect YouTube'}
                  </Button>
                </div>
              )}
              
              <div className="space-y-4">
                <h4 className="font-medium">Benefits of connecting YouTube:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Real-time analytics and performance metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    AI-powered content recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Trending topics analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Subscriber growth insights
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Revenue optimization suggestions
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Privacy & Security</h4>
                <p className="text-sm text-blue-700">
                  We only access read-only data from your YouTube channel. 
                  We cannot modify your channel, videos, or settings. 
                  You can disconnect at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="flex-1"
                    />
                    {profile.email_verified && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Account created: {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                />
              </div>
              <Button onClick={handleChangePassword}>
                <Key className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5" />
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive updates about your channel</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.preferences.newsletter}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, newsletter: e.target.checked }
                  })}
                  className="toggle"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-muted-foreground">Receive promotional content and tips</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.preferences.marketing_emails}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, marketing_emails: e.target.checked }
                  })}
                  className="toggle"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  <div>
                    <h4 className="font-medium">Security Alerts</h4>
                    <p className="text-sm text-muted-foreground">Important security notifications</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.preferences.security_alerts}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, security_alerts: e.target.checked }
                  })}
                  className="toggle"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5" />
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">Download a copy of your profile data</p>
                  </div>
                </div>
                <Button onClick={handleExportData} variant="outline">
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5" />
                  <div>
                    <h4 className="font-medium">Import Data</h4>
                    <p className="text-sm text-muted-foreground">Import profile data from file</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <div>
                    <h4 className="font-medium text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                </div>
                <Button onClick={handleDeleteAccount} variant="destructive">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Profile;
