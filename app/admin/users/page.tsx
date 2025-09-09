"use client"

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

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)

        // Simplest approach - just fetch from profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, created_at")
          .order("created_at", { ascending: false })

        if (!profilesError && profilesData && profilesData.length > 0) {
          // Transform the data to match our User interface
          const transformedUsers = profilesData.map((profile) => {
            return {
              id: profile.id,
              email: profile.username || `User ${profile.id.substring(0, 8)}...`,
              created_at: profile.created_at || new Date().toISOString(),
              last_sign_in_at: null, // We don't have this data
            }
          })
          setUsers(transformedUsers)
        } else {
          // Last resort - try to get users from watched_content or watchlist
          const { data: watchedData } = await supabase.from("watched_content").select("user_id").limit(100)

          const { data: watchlistData } = await supabase.from("watchlist").select("user_id").limit(100)

          // Combine user IDs and remove duplicates
          const userIds = new Set([
            ...(watchedData || []).map((item) => item.user_id),
            ...(watchlistData || []).map((item) => item.user_id),
          ])

          if (userIds.size > 0) {
            const userList = Array.from(userIds).map((id) => ({
              id,
              email: `User ${id.substring(0, 8)}...`,
              created_at: new Date().toISOString(),
              last_sign_in_at: null,
            }))
            setUsers(userList)
          } else {
            setUsers([])
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to fetch users. Please try again.",
          variant: "destructive",
        })
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter((user) => user.email.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleResetPassword = async (user: User) => {
    setSelectedUser(user)
    setResetDialogOpen(true)
  }

  const confirmResetPassword = async () => {
    if (!selectedUser) return

    try {
      setResetLoading(true)

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      toast({
        title: "Password reset email sent",
        description: `A password reset email has been sent to ${selectedUser.email}.`,
      })

      setResetDialogOpen(false)
    } catch (error: any) {
      console.error("Error sending password reset:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResetLoading(false)
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
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">View and manage user accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage registered users and their accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username/ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleResetPassword(user)}>
                          Reset Password
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

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              This will send a password reset email to the user. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              User: <span className="font-medium">{selectedUser?.email}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmResetPassword} disabled={resetLoading}>
              {resetLoading ? "Sending..." : "Send Reset Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
