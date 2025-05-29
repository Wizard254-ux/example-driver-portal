
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Save, X } from 'lucide-react';
import { organizationService, Organization, UpdateOrganizationData } from '../services/organization';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateOrganizationData>({});
  const { user } = useAuth();

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      // Using a dummy ID for now - you can replace this with the actual organization ID from user context
      const orgData = await organizationService.getOrganization(8);
      setOrganization(orgData);
      setEditData({
        name: orgData.name,
        description: orgData.description,
        website: orgData.website,
        email_domain: orgData.email_domain,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load organization data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;

    try {
      const updatedOrg = await organizationService.updateOrganization(organization.id, editData);
      setOrganization(updatedOrg);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Organization updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update organization.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (organization) {
      setEditData({
        name: organization.name,
        description: organization.description,
        website: organization.website,
        email_domain: organization.email_domain,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading organization data...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No organization data found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Organization Profile</h2>
          <p className="text-gray-600">Manage your organization information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            View and update your organization information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id">Organization ID</Label>
              <Input
                id="id"
                value={organization.id}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={organization.slug}
                disabled
                className="bg-gray-100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={isEditing ? editData.name || '' : organization.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-100" : ""}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={isEditing ? editData.description || '' : organization.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-100" : ""}
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={isEditing ? editData.website || '' : organization.website}
              onChange={(e) => setEditData({ ...editData, website: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-100" : ""}
            />
          </div>

          <div>
            <Label htmlFor="email_domain">Email Domain</Label>
            <Input
              id="email_domain"
              value={isEditing ? editData.email_domain || '' : organization.email_domain}
              onChange={(e) => setEditData({ ...editData, email_domain: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-100" : ""}
            />
          </div>

          <div>
            <Label htmlFor="is_active">Status</Label>
            <Input
              id="is_active"
              value={organization.is_active ? 'Active' : 'Inactive'}
              disabled
              className="bg-gray-100"
            />
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
