"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Tooltip
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseIcon from "@mui/icons-material/Close";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

export default function PackageRequests() {
  const router = useRouter();
  const [packageRequests, setPackageRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [rejectionLoading, setRejectionLoading] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    username: "",
    requestNumber: "",
    userName: ""
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchPackageRequests(1);
  }, [selectedStatus]);

  const fetchPackageRequests = async (page = 1) => {
    try {
      setLoading(true);
      let url = `/api/admin/package-requests?page=${page}&limit=20`;
      if (selectedStatus !== "all") {
        url += `&status=${selectedStatus}`;
      }
      if (searchFilters.username) {
        url += `&username=${encodeURIComponent(searchFilters.username)}`;
      }
      if (searchFilters.requestNumber) {
        url += `&requestNumber=${encodeURIComponent(searchFilters.requestNumber)}`;
      }
      if (searchFilters.userName) {
        url += `&userName=${encodeURIComponent(searchFilters.userName)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPackageRequests(data.packageRequests || []);
        setPagination(
          data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            limit: 20,
            hasNextPage: false,
            hasPrevPage: false
          }
        );
      } else if (response.status === 401) {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Error fetching package requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const response = await fetch(`/api/admin/package-requests/${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRequest(data.packageRequest);
      } else if (response.status === 401) {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus, customNotes = "") => {
    if (newStatus === "approved") {
      setApprovalLoading(true);
    } else if (newStatus === "rejected") {
      setRejectionLoading(true);
    }

    try {
      const response = await fetch(`/api/admin/package-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: customNotes || adminNoteInput
        })
      });

      if (response.ok) {
        fetchPackageRequests(pagination.currentPage);
        setShowDetailModal(false);
        setAdminNoteInput("");
      } else if (response.status === 401) {
        router.push("/admin/login");
      } else {
        const err = await response.json();
        alert(`Error: ${err.error || "Update failed"}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Error updating package status: ${error.message}`);
    } finally {
      setApprovalLoading(false);
      setRejectionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Chip
            label="APPROVED"
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 700,
              fontSize: "0.68rem",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}
          />
        );
      case "rejected":
        return (
          <Chip
            label="REJECTED"
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 700,
              fontSize: "0.68rem",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)"
            }}
          />
        );
      case "pending":
      default:
        return (
          <Chip
            label="PENDING REVIEW"
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 700,
              fontSize: "0.68rem",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(245, 158, 11, 0.3)"
            }}
          />
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <AssignmentTurnedInIcon sx={{ color: "#818cf8", fontSize: 26 }} />
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}
            >
              Package Purchase Requests
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            Review proof of bank deposit slips, verify funds receipt, and trigger multi-tier MLM distribution.
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{
              borderRadius: 0,
              backgroundColor: "#0c1220",
              color: "#ffffff",
              fontSize: "0.82rem",
              border: "1px solid rgba(255,255,255,0.1)",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.6)" }
            }}
          >
            <MenuItem value="all" sx={{ borderRadius: 0, fontSize: "0.82rem" }}>All Requests</MenuItem>
            <MenuItem value="pending" sx={{ borderRadius: 0, fontSize: "0.82rem" }}>Pending Verification</MenuItem>
            <MenuItem value="approved" sx={{ borderRadius: 0, fontSize: "0.82rem" }}>Approved Packages</MenuItem>
            <MenuItem value="rejected" sx={{ borderRadius: 0, fontSize: "0.82rem" }}>Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Filter Card */}
      <Card sx={{ borderRadius: 0, backgroundColor: "#0c1220", border: "1px solid rgba(255,255,255,0.08)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by username..."
                value={searchFilters.username}
                onChange={(e) => setSearchFilters({ ...searchFilters, username: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && fetchPackageRequests(1)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "rgba(255,255,255,0.4)", mr: 1, fontSize: 18 }} />
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    fontSize: "0.85rem"
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by request number..."
                value={searchFilters.requestNumber}
                onChange={(e) => setSearchFilters({ ...searchFilters, requestNumber: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && fetchPackageRequests(1)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    fontSize: "0.85rem"
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => fetchPackageRequests(1)}
                  sx={{
                    borderRadius: 0,
                    backgroundColor: "#6366f1",
                    color: "#ffffff",
                    fontWeight: 700,
                    py: 1,
                    "&:hover": { backgroundColor: "#4f46e5" }
                  }}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchFilters({ username: "", requestNumber: "", userName: "" });
                    fetchPackageRequests(1);
                  }}
                  sx={{
                    borderRadius: 0,
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    py: 1
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Requests Table */}
      <Card sx={{ borderRadius: 0, backgroundColor: "#0c1220", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Box sx={{ p: 2.5, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff", fontSize: "0.95rem" }}>
            Deposit Submissions Log
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
            Showing {packageRequests.length} of {pagination.totalCount || 0} Total
          </Typography>
        </Box>

        {loading && packageRequests.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 2 }}>
            <CircularProgress size={36} sx={{ color: "#6366f1" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              Fetching Package Requests...
            </Typography>
          </Box>
        ) : packageRequests.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <ReceiptLongIcon sx={{ fontSize: 44, color: "rgba(255,255,255,0.2)", mb: 1.5 }} />
            <Typography variant="body1" sx={{ color: "#ffffff", fontWeight: 600 }}>
              No Package Requests Found
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", mt: 0.5, display: "block" }}>
              No incoming deposit proofs match the specified query parameters.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                <TableRow>
                  <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.72rem", borderColor: "rgba(255,255,255,0.06)", py: 1.5 }}>
                    REQ # / USER
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.72rem", borderColor: "rgba(255,255,255,0.06)", py: 1.5 }}>
                    PACKAGE DETAILS
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.72rem", borderColor: "rgba(255,255,255,0.06)", py: 1.5 }}>
                    TRANSACTION ID
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.72rem", borderColor: "rgba(255,255,255,0.06)", py: 1.5 }}>
                    STATUS
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.72rem", borderColor: "rgba(255,255,255,0.06)", py: 1.5 }}>
                    SUBMITTED AT
                  </TableCell>
                  <TableCell align="right" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.72rem", borderColor: "rgba(255,255,255,0.06)", py: 1.5 }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packageRequests.map((req) => (
                  <TableRow
                    key={req.id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.02)" },
                      borderColor: "rgba(255,255,255,0.04)"
                    }}
                  >
                    <TableCell sx={{ borderColor: "rgba(255,255,255,0.06)", py: 2 }}>
                      <Typography variant="body2" sx={{ color: "#818cf8", fontWeight: 700, fontFamily: "monospace" }}>
                        #{req.id}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 600 }}>
                        {req.user?.fullname || "Anonymous"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                        @{req.user?.username}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: "rgba(255,255,255,0.06)", py: 2 }}>
                      <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 700 }}>
                        {req.package?.package_name || "Custom Tier"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#34d399", fontWeight: 700, display: "block" }}>
                        PKR {parseFloat(req.package?.package_amount || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: 600 }}>
                        Points: {req.package?.package_points || 0}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: "rgba(255,255,255,0.06)", py: 2 }}>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontFamily: "monospace", fontSize: "0.82rem" }}>
                        {req.transactionId || "N/A"}
                      </Typography>
                      {req.transactionReceipt && (
                        <Typography variant="caption" sx={{ color: "#818cf8", fontWeight: 600, display: "block" }}>
                          Receipt Attached
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ borderColor: "rgba(255,255,255,0.06)", py: 2 }}>
                      {getStatusBadge(req.status)}
                    </TableCell>

                    <TableCell sx={{ borderColor: "rgba(255,255,255,0.06)", py: 2, color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>
                      {formatDate(req.createdAt)}
                    </TableCell>

                    <TableCell align="right" sx={{ borderColor: "rgba(255,255,255,0.06)", py: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => fetchRequestDetails(req.id)}
                          sx={{
                            borderRadius: 0,
                            borderColor: "rgba(99, 102, 241, 0.4)",
                            color: "#818cf8",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            py: 0.5,
                            "&:hover": {
                              borderColor: "#818cf8",
                              backgroundColor: "rgba(99, 102, 241, 0.1)"
                            }
                          }}
                        >
                          Review Slip
                        </Button>

                        {req.status === "pending" && (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                if (confirm(`Approve package request #${req.id}?`)) {
                                  handleStatusUpdate(req.id, "approved");
                                }
                              }}
                              sx={{
                                borderRadius: 0,
                                backgroundColor: "#10b981",
                                color: "#ffffff",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                py: 0.5,
                                "&:hover": { backgroundColor: "#059669" }
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                const note = prompt("Reason for rejection:");
                                if (note !== null) {
                                  handleStatusUpdate(req.id, "rejected", note);
                                }
                              }}
                              sx={{
                                borderRadius: 0,
                                borderColor: "rgba(239, 68, 68, 0.4)",
                                color: "#f87171",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                py: 0.5,
                                "&:hover": {
                                  borderColor: "#ef4444",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)"
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(255,255,255,0.01)"
            }}
          >
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} records)
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                disabled={!pagination.hasPrevPage}
                onClick={() => fetchPackageRequests(pagination.currentPage - 1)}
                size="small"
                variant="outlined"
                startIcon={<NavigateBeforeIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: 0,
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  fontSize: "0.74rem",
                  "&.Mui-disabled": { borderColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }
                }}
              >
                Previous
              </Button>
              <Button
                disabled={!pagination.hasNextPage}
                onClick={() => fetchPackageRequests(pagination.currentPage + 1)}
                size="small"
                variant="outlined"
                endIcon={<NavigateNextIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: 0,
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  fontSize: "0.74rem",
                  "&.Mui-disabled": { borderColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Card>

      {/* Slip / Detail Review Dialog */}
      <Dialog
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            backgroundColor: "#0d131f",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#ffffff"
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
              Package Request Verification #{selectedRequest?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: "#818cf8", fontFamily: "monospace" }}>
              TRANSACTION ID: {selectedRequest?.transactionId || "NONE"}
            </Typography>
          </Box>
          <IconButton onClick={() => setShowDetailModal(false)} sx={{ color: "rgba(255,255,255,0.6)", borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {detailLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 2 }}>
              <CircularProgress size={36} sx={{ color: "#6366f1" }} />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>Loading details and receipt...</Typography>
            </Box>
          ) : selectedRequest ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {(approvalLoading || rejectionLoading) && (
                <Box sx={{ p: 2, backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                  <Typography variant="body2" sx={{ color: "#818cf8", fontWeight: 600, mb: 1 }}>
                    {approvalLoading ? "Processing Multi-Level Commission Distribution..." : "Processing Request Rejection..."}
                  </Typography>
                  <LinearProgress sx={{ borderRadius: 0, height: 4, backgroundColor: "rgba(99, 102, 241, 0.2)", "& .MuiLinearProgress-bar": { backgroundColor: "#6366f1" } }} />
                </Box>
              )}

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ borderRadius: 0, backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#818cf8", mb: 1.5 }}>
                        INVESTOR PROFILE
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Full Name:</Typography>
                          <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 600 }}>{selectedRequest.user?.fullname}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Username:</Typography>
                          <Typography variant="caption" sx={{ color: "#818cf8", fontWeight: 600 }}>@{selectedRequest.user?.username}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Email:</Typography>
                          <Typography variant="caption" sx={{ color: "#ffffff" }}>{selectedRequest.user?.email}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ borderRadius: 0, backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#34d399", mb: 1.5 }}>
                        INVESTMENT DETAILS
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Selected Package:</Typography>
                          <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 700 }}>{selectedRequest.package?.package_name}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Price Amount:</Typography>
                          <Typography variant="caption" sx={{ color: "#34d399", fontWeight: 800 }}>PKR {parseFloat(selectedRequest.package?.package_amount || 0).toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Points Awarded:</Typography>
                          <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: 700 }}>{selectedRequest.package?.package_points || 0}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Verification Status:</Typography>
                          {getStatusBadge(selectedRequest.status)}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Receipt Preview */}
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 0, backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#fbbf24", mb: 1.5 }}>
                        OFFICIAL PAYMENT RECEIPT / DEPOSIT SLIP
                      </Typography>
                      {selectedRequest.transactionReceipt ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: "100%",
                              maxWidth: 520,
                              height: 380,
                              position: "relative",
                              backgroundColor: "#000000",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 0,
                              overflow: "hidden"
                            }}
                          >
                            <Image
                              src={selectedRequest.transactionReceipt}
                              alt="Payment Proof"
                              fill
                              style={{ objectFit: "contain" }}
                            />
                          </Box>
                          <Button
                            component="a"
                            href={selectedRequest.transactionReceipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 0, borderColor: "rgba(255,255,255,0.2)", color: "#ffffff", fontSize: "0.75rem" }}
                          >
                            Open Full-Resolution Image In New Tab
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ p: 3, textAlign: "center", backgroundColor: "rgba(0,0,0,0.2)" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                            No digital receipt was attached by member. Verified solely via Transaction ID.
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Notes Input for Decision */}
                {selectedRequest.status === "pending" && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Administrative Note (Optional)"
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="e.g. Bank slip verified on Meezan portal. Transaction reference: 994821"
                      InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" } }}
                      InputProps={{
                        sx: {
                          borderRadius: 0,
                          backgroundColor: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.15)",
                          color: "#ffffff"
                        }
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
          <Button
            onClick={() => setShowDetailModal(false)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 0, borderColor: "rgba(255,255,255,0.2)", color: "#ffffff" }}
          >
            Close
          </Button>

          {selectedRequest?.status === "pending" && (
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                onClick={() => handleStatusUpdate(selectedRequest.id, "rejected")}
                disabled={rejectionLoading || approvalLoading}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 0,
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  fontWeight: 700,
                  "&:hover": { borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)" }
                }}
              >
                {rejectionLoading ? "Rejecting..." : "Reject Request"}
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedRequest.id, "approved")}
                disabled={approvalLoading || rejectionLoading}
                variant="contained"
                size="small"
                sx={{
                  borderRadius: 0,
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  fontWeight: 700,
                  "&:hover": { backgroundColor: "#059669" }
                }}
              >
                {approvalLoading ? "Approving MLM..." : "Approve Package"}
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
