"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAcceptInvitation } from "@/hooks/use-user-management"
import { createClient } from "@/lib/supabase/client"

export default function AcceptInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const invitationId = params.token as string // Actually invitation ID now

  const [invitationDetails, setInvitationDetails] = useState<{
    email?: string
    company_name?: string
    role?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const { mutate: acceptInvitation, isPending } = useAcceptInvitation()

  useEffect(() => {
    // Check for auth errors in URL hash
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1))
      const error = params.get('error')
      const errorDescription = params.get('error_description')
      
      if (error === 'access_denied' && errorDescription?.includes('expired')) {
        setError("The email link has expired. Please request a new invitation from your administrator.")
        setIsLoading(false)
        return
      }
    }
    
    checkAuthAndInvitation()
  }, [invitationId])

  const checkAuthAndInvitation = async () => {
    try {
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      // Fetch invitation details by ID instead of token
      const { data: invitation, error: invError } = await supabase
        .from("invitations")
        .select("*")
        .eq("id", invitationId)
        .single()

      if (invError || !invitation) {
        console.error("Invitation fetch error:", invError)
        setError("Invalid or expired invitation link")
        setIsLoading(false)
        return
      }

      // Fetch company name separately
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", invitation.company_id)
        .single()

      if (invitation.status === "accepted") {
        setError("This invitation has already been accepted")
        setIsLoading(false)
        return
      }

      if (invitation.status === "revoked") {
        setError("This invitation has been revoked")
        setIsLoading(false)
        return
      }

      if (new Date(invitation.expires_at) < new Date()) {
        setError("This invitation has expired")
        setIsLoading(false)
        return
      }

      setInvitationDetails({
        email: invitation.email,
        company_name: company?.name || "the organization",
        role: invitation.role,
      })

      // If user is authenticated and invitation is valid, auto-accept
      if (user) {
        // Check if user email matches invitation email
        if (user.email !== invitation.email) {
          setError(`This invitation is for ${invitation.email}. Please sign in with that account.`)
          setIsLoading(false)
          return
        }

        // Auto-accept invitation using invitation ID
        acceptInvitation({ token: invitation.token })
      } else {
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error checking invitation:", err)
      setError("Failed to load invitation details")
      setIsLoading(false)
    }
  }

  const handleSignUpAndAccept = () => {
    // Redirect to signup with invitation ID
    router.push(`/auth/signup?invitation=${invitationId}&email=${invitationDetails?.email}`)
  }

  const handleSignInAndAccept = () => {
    // Redirect to signin with invitation ID
    router.push(`/auth/signin?invitation=${invitationId}`)
  }

  if (isLoading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-semibold">
            {isPending ? "Accepting invitation..." : "Loading invitation..."}
          </h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border rounded-lg p-8 text-center space-y-4">
          <XCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Invitation Invalid</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // User needs to sign up or sign in
  if (!isAuthenticated && invitationDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border rounded-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">You're Invited!</h1>
            <p className="text-muted-foreground">
              You've been invited to join <strong>{invitationDetails.company_name}</strong> as a{" "}
              <strong>{invitationDetails.role}</strong>
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleSignUpAndAccept} className="w-full">
              Create Account & Accept
            </Button>
            <Button onClick={handleSignInAndAccept} variant="outline" className="w-full">
              Sign In & Accept
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Invitation sent to: {invitationDetails.email}
          </p>
        </div>
      </div>
    )
  }

  return null
}
