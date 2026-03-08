"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Flag, CheckCircle } from "lucide-react"
import { reportUser } from "@/lib/actions/admin"

interface ReportButtonProps {
  reportedUserId: string
  reportedUsername: string
}

export function ReportButton({ reportedUserId, reportedUsername }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) return
    setLoading(true)
    const { error } = await reportUser(reportedUserId, reason.trim())
    setLoading(false)
    if (!error) {
      setSubmitted(true)
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setReason("")
      }, 1500)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30">
          <Flag className="w-3.5 h-3.5" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-medium">Report submitted</p>
            <p className="text-sm text-muted-foreground mt-1">The admin team will review this report.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">Report {reportedUsername}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Please describe why you are reporting this user. Reports are reviewed by the admin team.
            </p>
            <Input
              placeholder="Reason for report..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSubmit}
                disabled={!reason.trim() || loading}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
