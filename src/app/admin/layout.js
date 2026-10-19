"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Chip,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { AdminThemeProvider, useAdminTheme } from "@/context/AdminThemeContext";

const DRAWER_WIDTH = 270;

const adminMenuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <DashboardOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "OVERVIEW"
  },
  {
    label: "User Management",
    href: "/admin/user-management",
    icon: <PeopleAltOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "MEMBERSHIP"
  },
  {
    label: "KYC Verification",
    href: "/admin/kyc-verification",
    icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "MEMBERSHIP"
  },
  {
    label: "Package Requests",
    href: "/admin/package-requests",
    icon: <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "FINANCIAL & PACKAGES"
  },
  {
    label: "Withdrawal Requests",
    href: "/admin/withdrawals",
    icon: <PaymentsOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "FINANCIAL & PACKAGES"
  },
  {
    label: "Direct Transfers",
    href: "/admin/transfers",
    icon: <SwapHorizOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "FINANCIAL & PACKAGES"
  },
  {
    label: "Bank Accounts",
    href: "/admin/bank-accounts",
    icon: <AccountBalanceOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "FINANCIAL & PACKAGES"
  },
  {
    label: "Package Plans",
    href: "/admin/packages",
    icon: <CardGiftcardOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "COMMERCE & CATALOG"
  },
  {
    label: "Product Catalog",
    href: "/admin/products",
    icon: <Inventory2OutlinedIcon sx={{ fontSize: 20 }} />,
    category: "COMMERCE & CATALOG"
  },
  {
    label: "Order Tracking",
    href: "/admin/orders",
    icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "COMMERCE & CATALOG"
  },
  {
    label: "Rank Qualifications",
    href: "/admin/ranks",
    icon: <WorkspacePremiumOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "COMMERCE & CATALOG"
  },
  {
    label: "Slider Images",
    href: "/admin/slider-images",
    icon: <CollectionsOutlinedIcon sx={{ fontSize: 20 }} />,
    category: "SYSTEM & CMS"
  }
];

function AdminLayoutShell({ children }) {
  const [admin, setAdmin] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const { isLight, toggleTheme } = useAdminTheme();

  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/signup";

  useEffect(() => {
    if (isLoginPage) {
      localStorage.removeItem("admin");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("auth-token");
      return;
    }

    const checkAdminAuth = async () => {
      try {
        const adminToken = localStorage.getItem("adminToken");

        const response = await fetch("/api/admin/stats", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(adminToken && { Authorization: `Bearer ${adminToken}` })
          }
        });

        if (!response.ok) {
          localStorage.removeItem("admin");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("user");
          localStorage.removeItem("auth-token");
          router.push("/admin/login");
          return;
        }

        const data = await response.json();
        if (data.success) {
          const adminData = localStorage.getItem("admin");
          if (adminData) {
            try {
              setAdmin(JSON.parse(adminData));
            } catch (err) {
              console.error("Error parsing admin data:", err);
              router.push("/admin/login");
            }
          } else {
            router.push("/admin/login");
          }
        } else {
          localStorage.removeItem("admin");
          localStorage.removeItem("adminToken");
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Admin auth check failed:", error);
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
      }
    };

    checkAdminAuth();
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("admin");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("auth-token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth");
      router.push("/admin/login");
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!admin) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: isLight ? "#f1f5f9" : "#070a12",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2
        }}
      >
        <CircularProgress size={44} sx={{ color: "#6366f1" }} />
        <Typography
          variant="body2"
          sx={{
            color: isLight ? "#64748b" : "rgba(255,255,255,0.6)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            fontWeight: 600
          }}
        >
          Validating Security Credentials...
        </Typography>
      </Box>
    );
  }

  // Dynamic colors based on theme
  const drawerBg = isLight ? "#ffffff" : "#0a0e17";
  const drawerBorder = isLight ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.06)";
  const brandHeaderBg = isLight ? "#f8fafc" : "rgba(15, 23, 42, 0.4)";
  const brandTitleColor = isLight ? "#0f172a" : "#ffffff";
  const brandSubColor = isLight ? "#64748b" : "rgba(255,255,255,0.45)";
  const categoryHeaderColor = isLight ? "#64748b" : "rgba(255,255,255,0.38)";
  const itemTextColor = isLight ? "#334155" : "rgba(255,255,255,0.72)";
  const itemIconColor = isLight ? "#64748b" : "rgba(255,255,255,0.55)";
  const sidebarFooterBg = isLight ? "#f8fafc" : "rgba(10, 14, 23, 0.95)";
  const appBarBg = isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(10, 14, 23, 0.85)";
  const appBarBorder = isLight ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.06)";
  const appBarTitleColor = isLight ? "#0f172a" : "#ffffff";
  const mainBg = isLight ? "#f1f5f9" : "#070a12";
  const footerBg = isLight ? "#ffffff" : "#080c14";
  const footerBorder = isLight ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.05)";
  const footerTextColor = isLight ? "#64748b" : "rgba(255,255,255,0.4)";

  // Group menu items by category
  const categories = Array.from(new Set(adminMenuItems.map((i) => i.category)));

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: drawerBg,
        borderRight: drawerBorder,
        borderRadius: 0,
        overflow: "hidden"
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: drawerBorder,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          backgroundColor: brandHeaderBg,
          borderRadius: 0
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: 40,
            height: 40,
            backgroundColor: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0
          }}
        >
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={32}
            height={32}
            style={{ objectFit: "contain" }}
          />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: brandTitleColor,
                letterSpacing: "0.04em",
                lineHeight: 1.2,
                fontSize: "1rem"
              }}
            >
              LEDORA
            </Typography>
            <Chip
              label="ADMIN"
              size="small"
              sx={{
                height: 18,
                fontSize: "0.62rem",
                fontWeight: 700,
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                color: "#6366f1",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: 0,
                px: 0.3
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: brandSubColor,
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            Management Portal
          </Typography>
        </Box>
        {!isDesktop && (
          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={{ color: itemIconColor, borderRadius: 0 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Nav List */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 2 }}>
        {categories.map((cat) => (
          <Box key={cat} sx={{ mb: 2.2 }}>
            <Typography
              variant="caption"
              sx={{
                px: 3,
                py: 0.6,
                display: "block",
                color: categoryHeaderColor,
                fontWeight: 700,
                fontSize: "0.68rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase"
              }}
            >
              {cat}
            </Typography>
            <List disablePadding>
              {adminMenuItems
                .filter((item) => item.category === cat)
                .map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <ListItem key={item.href} disablePadding sx={{ px: 1.5, py: 0.25 }}>
                      <ListItemButton
                        component={Link}
                        href={item.href}
                        onClick={() => {
                          if (!isDesktop) setMobileOpen(false);
                        }}
                        sx={{
                          py: 0.85,
                          px: 1.6,
                          borderRadius: 0,
                          backgroundColor: isActive
                            ? isLight ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.18)"
                            : "transparent",
                          borderLeft: isActive
                            ? "3px solid #6366f1"
                            : "3px solid transparent",
                          color: isActive
                            ? isLight ? "#4f46e5" : "#ffffff"
                            : itemTextColor,
                          transition: "all 0.15s ease",
                          "&:hover": {
                            backgroundColor: isActive
                              ? isLight ? "rgba(99, 102, 241, 0.18)" : "rgba(99, 102, 241, 0.25)"
                              : isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.04)",
                            color: isLight ? "#0f172a" : "#ffffff",
                            "& .MuiListItemIcon-root": {
                              color: "#6366f1"
                            }
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 34,
                            color: isActive ? "#6366f1" : itemIconColor,
                            transition: "color 0.15s"
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: "0.84rem",
                            fontWeight: isActive ? 700 : 500,
                            color: isActive
                              ? isLight ? "#4f46e5" : "#ffffff"
                              : itemTextColor
                          }}
                        />
                        {isActive && (
                          <ArrowForwardIosIcon
                            sx={{ fontSize: 10, color: "#6366f1", ml: 0.5 }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Sidebar Footer: Logout & Powered By */}
      <Box
        sx={{
          p: 2,
          borderTop: drawerBorder,
          backgroundColor: sidebarFooterBg,
          borderRadius: 0
        }}
      >
        <ListItemButton
          onClick={handleLogout}
          sx={{
            py: 1,
            px: 1.5,
            borderRadius: 0,
            border: "1px solid rgba(239, 68, 68, 0.25)",
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            color: "#f87171",
            mb: 1.5,
            "&:hover": {
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)"
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "#f87171" }}>
            <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Sign Out"
            primaryTypographyProps={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#f87171"
            }}
          />
        </ListItemButton>

        {/* Mandatory RAPIDTECHPRO link */}
        <Box sx={{ textAlign: "center", pt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: isLight ? "#64748b" : "rgba(255,255,255,0.4)",
              fontSize: "0.7rem",
              letterSpacing: "0.04em",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5
            }}
          >
            Powerd By :
            <Box
              component="a"
              href="https://rapidtechpro.com/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "#6366f1",
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: "0.05em",
                transition: "color 0.2s",
                "&:hover": {
                  color: "#4f46e5",
                  textDecoration: "underline"
                }
              }}
            >
              RAPIDTECHPRO
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: mainBg }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { lg: `${DRAWER_WIDTH}px` },
          backgroundColor: appBarBg,
          backdropFilter: "blur(12px)",
          borderBottom: appBarBorder,
          borderRadius: 0,
          color: appBarTitleColor
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { lg: "none" }, borderRadius: 0 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AdminPanelSettingsOutlinedIcon
                sx={{ fontSize: 20, color: "#6366f1" }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.95rem", sm: "1.1rem" },
                  color: appBarTitleColor,
                  letterSpacing: "0.02em"
                }}
              >
                Control Console
              </Typography>
              <Chip
                label="LIVE SYSTEM"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: 0,
                  display: { xs: "none", sm: "inline-flex" }
                }}
              />
            </Box>
          </Box>

          {/* Right Action Icons & Theme Toggle */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Theme Toggle Button */}
            <Tooltip title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}>
              <Button
                onClick={toggleTheme}
                size="small"
                variant="outlined"
                startIcon={
                  isLight ? (
                    <DarkModeOutlinedIcon sx={{ fontSize: 18, color: "#4f46e5" }} />
                  ) : (
                    <LightModeOutlinedIcon sx={{ fontSize: 18, color: "#fbbf24" }} />
                  )
                }
                sx={{
                  borderRadius: 0,
                  borderColor: isLight ? "#cbd5e1" : "rgba(255,255,255,0.15)",
                  color: isLight ? "#0f172a" : "#ffffff",
                  backgroundColor: isLight ? "#f8fafc" : "rgba(255,255,255,0.04)",
                  textTransform: "uppercase",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  px: 1.5,
                  py: 0.6,
                  "&:hover": {
                    borderColor: "#6366f1",
                    backgroundColor: isLight ? "#e2e8f0" : "rgba(99, 102, 241, 0.15)"
                  }
                }}
              >
                {isLight ? "Dark" : "Light"}
              </Button>
            </Tooltip>

            <Tooltip title="View Frontend Portal">
              <IconButton
                component={Link}
                href="/"
                target="_blank"
                sx={{
                  color: isLight ? "#475569" : "rgba(255,255,255,0.7)",
                  border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 0,
                  p: 1,
                  "&:hover": {
                    backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)",
                    color: isLight ? "#0f172a" : "#ffffff"
                  }
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Admin Notifications">
              <IconButton
                sx={{
                  color: isLight ? "#475569" : "rgba(255,255,255,0.7)",
                  border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 0,
                  p: 1,
                  "&:hover": {
                    backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)",
                    color: isLight ? "#0f172a" : "#ffffff"
                  }
                }}
              >
                <Badge
                  variant="dot"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "#6366f1",
                      borderRadius: 0
                    }
                  }}
                >
                  <NotificationsOutlinedIcon sx={{ fontSize: 18 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Admin Profile Menu Trigger */}
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                cursor: "pointer",
                p: 0.6,
                px: 1.2,
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: isLight ? "#f8fafc" : "rgba(255,255,255,0.02)",
                borderRadius: 0,
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: isLight ? "#e2e8f0" : "rgba(255,255,255,0.06)",
                  borderColor: "rgba(99, 102, 241, 0.4)"
                }
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 0,
                  background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
                  fontSize: "0.8rem",
                  fontWeight: 700
                }}
              >
                {admin?.username?.charAt(0).toUpperCase() || "A"}
              </Avatar>
              <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "left" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: isLight ? "#0f172a" : "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    lineHeight: 1.1
                  }}
                >
                  {admin?.fullName || admin?.username || "Admin"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isLight ? "#64748b" : "rgba(255,255,255,0.45)",
                    fontSize: "0.68rem"
                  }}
                >
                  Super Admin
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  backgroundColor: isLight ? "#ffffff" : "#0d131f",
                  border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 0,
                  minWidth: 180,
                  mt: 1,
                  boxShadow: isLight
                    ? "0 10px 25px rgba(0,0,0,0.1)"
                    : "0 10px 30px rgba(0,0,0,0.5)"
                }
              }}
            >
              <MenuItem
                component={Link}
                href="/admin/user-management"
                onClick={() => setAnchorEl(null)}
                sx={{
                  color: isLight ? "#0f172a" : "rgba(255,255,255,0.85)",
                  fontSize: "0.85rem",
                  py: 1,
                  borderRadius: 0,
                  "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.12)" }
                }}
              >
                User Accounts
              </MenuItem>
              <MenuItem
                component={Link}
                href="/admin/bank-accounts"
                onClick={() => setAnchorEl(null)}
                sx={{
                  color: isLight ? "#0f172a" : "rgba(255,255,255,0.85)",
                  fontSize: "0.85rem",
                  py: 1,
                  borderRadius: 0,
                  "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.12)" }
                }}
              >
                Banking Setup
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  handleLogout();
                }}
                sx={{
                  color: "#f87171",
                  fontSize: "0.85rem",
                  py: 1,
                  borderRadius: 0,
                  borderTop: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.06)",
                  "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.1)" }
                }}
              >
                Log Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer - Mobile and Desktop */}
      <Box
        component="nav"
        sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRadius: 0,
              borderRight: drawerBorder,
              backgroundColor: drawerBg
            }
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRadius: 0,
              borderRight: drawerBorder,
              backgroundColor: drawerBg
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: mainBg,
          pt: 8
        }}
      >
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 } }}>{children}</Box>

        {/* Global Admin Footer */}
        <Box
          component="footer"
          sx={{
            py: 2.5,
            px: 3,
            borderTop: footerBorder,
            backgroundColor: footerBg,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            borderRadius: 0
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: footerTextColor,
              fontSize: "0.75rem",
              letterSpacing: "0.03em"
            }}
          >
            © {new Date().getFullYear()} Ledora Global Enterprise Management Console.
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isLight ? "#475569" : "rgba(255,255,255,0.5)",
              fontSize: "0.75rem",
              letterSpacing: "0.03em",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6
            }}
          >
            Powerd By :
            <Box
              component="a"
              href="https://rapidtechpro.com/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "#6366f1",
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: "0.04em",
                transition: "color 0.2s",
                "&:hover": {
                  color: "#4f46e5",
                  textDecoration: "underline"
                }
              }}
            >
              RAPIDTECHPRO
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminThemeProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminThemeProvider>
  );
}
