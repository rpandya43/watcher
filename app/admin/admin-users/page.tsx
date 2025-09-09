"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AdminUser {
  id: number
  email: string
  created_at: string
}

export default function AdminUsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [deletingAdmin, setDeletingAdmin] = useState(false)

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        setLoading(true)

        // Ensure admin_users table exists
        await fetch("/api/create-tables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table: "admin_users",
          }),
        })

        // Get admin users
        const { data, error } = await supabase.from("admin_users").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setAdminUsers(data || [])
      } catch (error) {
        console.error("Error fetching admin users:", error)
        toast({
          title: "Error",
          description: "Failed to fetch admin users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAdminUsers()
  }, [])

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newAdminEmail || !newAdminEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    try {
      setAddingAdmin(true)

      // Check if admin already exists
      const { data: existingAdmin } = await supabase.from("admin_users").select("*").eq("email", newAdminEmail).single()

      if (existingAdmin) {
        toast({
          title: "Admin Already Exists",
          description: "This email is already registered as an admin.",
          variant: "destructive",
        })
        return
      }

      // Add new admin
      const { data, error } = await supabase.from("admin_users").insert({ email: newAdminEmail }).select()

      if (error) throw error

      toast({
        title: "Admin Added",
        description: `${newAdminEmail} has been added as an admin.`,
      })

      setAdminUsers([...(data || []), ...adminUsers])
      setNewAdminEmail("")
    } catch (error) {
      console.error("Error adding admin:", error)
      toast({
        title: "Error",
        description: "Failed to add admin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleDeleteAdmin = (user: AdminUser) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteAdmin = async () => {
    if (!selectedUser) return

    try {
      setDeletingAdmin(true)

      const { error } = await supabase.from("admin_users").delete().eq("id", selectedUser.id)

      if (error) throw error

      toast({
        title: "Admin Removed",
        description: `${selectedUser.email} has been removed as an admin.`,
      })

      setAdminUsers(adminUsers.filter((user) => user.id !== selectedUser.id))
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting admin:", error)
      toast({
        title: "Error",
        description: "Failed to remove admin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingAdmin(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Users Management</h1>
        <p className="text-muted-foreground">Manage who has admin access to the application</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Admin</CardTitle>
          <CardDescription>Grant admin privileges to a user by email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={addingAdmin}>
              {addingAdmin ? "Adding..." : "Add Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Admins</CardTitle>
          <CardDescription>Users with administrative privileges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No admin users found
                    </TableCell>
                  </TableRow>
                ) : (
                  adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAdmin(user)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Admin</DialogTitle>
            <DialogDescription>
              This will remove admin privileges from this user. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Admin: <span className="font-medium">{selectedUser?.email}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAdmin} disabled={deletingAdmin}>
              {deletingAdmin ? "Removing..." : "Remove Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
