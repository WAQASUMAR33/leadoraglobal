"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { auth } from "../../lib/auth";
import { UserProvider } from "../../lib/userContext";
import { AppThemeProvider, useAppTheme } from "@/context/AdminThemeContext";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Chip,
  Divider,
  Stack,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip
} from "@mui/material";
import {
  Menu as MenuIcon,
  DashboardOutlined,
  Inventory2Outlined,
  AccountTreeOutlined,
  StorefrontOutlined,
  MonetizationOnOutlined,
  AccountBalanceWalletOutlined,
  VerifiedUserOutlined,
  ExpandLess,
  ExpandMore,
  ExitToApp,
  ShoppingCartOutlined,
  HistoryOutlined,
  SwapHorizOutlined,
  GroupOutlined,
  PersonAddOutlined,
  CreditCardOutlined,
  BadgeOutlined,
  LightModeOutlined,
  DarkModeOutlined
} from "@mui/icons-material";

const DRAWER_WIDTH = 270;

const menuConfig = [
  {
    label: "Dashboard",
    href: "/user-dashboard",
    icon: <DashboardOutlined sx={{ fontSize: 20 }} />,
  },
  {
    label: "My Package",
    icon: <Inventory2Outlined sx={{ fontSize: 20 }} />,
    key: "package",
    subItems: [
      { label: "My Package", href: "/user-dashboard/my-package", icon: <Inventory2Outlined sx={{ fontSize: 18 }} /> },
      { label: "Buy Package", href: "/user-dashboard/subscribe", icon: <CreditCardOutlined sx={{ fontSize: 18 }} /> },
      { label: "Upgrade Package", href: "/user-dashboard/upgrade-package", icon: <SwapHorizOutlined sx={{ fontSize: 18 }} /> },
    ],
  },
  {
    label: "Downline",
    icon: <AccountTreeOutlined sx={{ fontSize: 20 }} />,
    key: "downline",
    subItems: [
      { label: "Downlist", href: "/user-dashboard/downlist", icon: <AccountTreeOutlined sx={{ fontSize: 18 }} /> },
      { label: "Direct Referrals", href: "/user-dashboard/referrals", icon: <GroupOutlined sx={{ fontSize: 18 }} /> },
      { label: "Free Accounts", href: "/user-dashboard/free-accounts", icon: <PersonAddOutlined sx={{ fontSize: 18 }} /> },
    ],
  },
  {
    label: "Shop & Orders",
    icon: <StorefrontOutlined sx={{ fontSize: 20 }} />,
    key: "shop",
    subItems: [
      { label: "Browse Products", href: "/user-dashboard/shop", icon: <StorefrontOutlined sx={{ fontSize: 18 }} /> },
      { label: "Shopping Cart", href: "/user-dashboard/cart", icon: <ShoppingCartOutlined sx={{ fontSize: 18 }} /> },
      { label: "My Orders", href: "/user-dashboard/orders", icon: <HistoryOutlined sx={{ fontSize: 18 }} /> },
      { label: "Transfer Shopping", href: "/user-dashboard/transfer-shopping", icon: <SwapHorizOutlined sx={{ fontSize: 18 }} /> },
    ],
  },
  {
    label: "My Earnings",
    icon: <MonetizationOnOutlined sx={{ fontSize: 20 }} />,
    key: "earnings",
    subItems: [
      { label: "Earnings Overview", href: "/user-dashboard/earnings", icon: <MonetizationOnOutlined sx={{ fontSize: 18 }} /> },
      { label: "Transfer to Others", href: "/user-dashboard/transfer-to-others", icon: <SwapHorizOutlined sx={{ fontSize: 18 }} /> },
    ],
  },
  {
    label: "Withdrawals",
    icon: <AccountBalanceWalletOutlined sx={{ fontSize: 20 }} />,
    key: "withdrawals",
    subItems: [
      { label: "Withdraw Request", href: "/user-dashboard/withdraw", icon: <AccountBalanceWalletOutlined sx={{ fontSize: 18 }} /> },
      { label: "Withdraw History", href: "/user-dashboard/withdrawals", icon: <HistoryOutlined sx={{ fontSize: 18 }} /> },
      { label: "Payment Methods", href: "/user-dashboard/payment-methods", icon: <CreditCardOutlined sx={{ fontSize: 18 }} /> },
    ],
  },
  {
    label: "KYC & Profile",
    icon: <VerifiedUserOutlined sx={{ fontSize: 20 }} />,
    key: "kyc",
    subItems: [
      { label: "My Profile", href: "/user-dashboard/profile", icon: <BadgeOutlined sx={{ fontSize: 18 }} /> },
      { label: "KYC Verification", href: "/user-dashboard/kyc", icon: <VerifiedUserOutlined sx={{ fontSize: 18 }} /> },
    ],
  },
];

function UserDashboardShell({ children }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const { isLight, toggleTheme } = useAppTheme();

  useEffect(() => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");

    const currentUser = auth.getUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      const defaultUser = {
        id: 1,
        username: "waqasumar33",
        fullname: "Waqas Umar",
        email: "dilwaq22@gmail.com",
        balance: "0",
        points: 86015,
        shoppingAmount: "2000",
        totalEarnings: "355385",
        packageId: 8,
        status: "active"
      };
      auth.setUser(defaultUser);
      setUser(defaultUser);
    }
  }, []);

  // Automatically expand active submenu
  useEffect(() => {
    menuConfig.forEach((item) => {
      if (item.subItems?.some((sub) => pathname.startsWith(sub.href))) {
        setOpenSubmenus((prev) => ({ ...prev, [item.key]: true }));
      }
    });
  }, [pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSubmenuToggle = (key) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUserMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    try {
      await auth.logoutWithAPI();
    } catch (error) {
      console.warn("Failed to call logout API:", error);
    } finally {
      auth.logout();
      localStorage.removeItem("admin");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("auth-token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth");
      window.location.href = "/login";
    }
  };

  // Color tokens
  const drawerBg = isLight ? "#ffffff" : "#0a0e17";
  const drawerBorder = isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)";
  const brandHeaderBg = isLight ? "#f8fafc" : "rgba(15, 23, 42, 0.6)";
  const brandTitleColor = isLight ? "#0f172a" : "#f8fafc";
  const brandSubColor = isLight ? "#6366f1" : "#818cf8";
  const itemTextColor = isLight ? "#334155" : "#94a3b8";
  const itemIconColor = isLight ? "#64748b" : "#64748b";
  const sidebarFooterBg = isLight ? "#f8fafc" : "rgba(10, 14, 23, 0.95)";
  const appBarBg = isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(10, 14, 23, 0.85)";
  const appBarBorder = isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)";
  const appBarTitleColor = isLight ? "#0f172a" : "#f8fafc";
  const mainBg = isLight ? "#f1f5f9" : "#070a12";
  const footerBg = isLight ? "#ffffff" : "#080c14";
  const footerBorder = isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.06)";
  const footerTextColor = isLight ? "#64748b" : "#64748b";

  // Sidebar Drawer Content
  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: drawerBg,
        color: brandTitleColor,
        borderRight: drawerBorder,
        borderRadius: 0,
      }}
    >
      {/* Sidebar Header with Ledora Global Badge */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: drawerBorder,
          backgroundColor: brandHeaderBg,
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            position: "relative",
            overflow: "hidden",
            borderRadius: 0,
            border: "1px solid rgba(99, 102, 241, 0.4)",
            flexShrink: 0,
          }}
        >
          <Image src="/images/logo.png" alt="Logo" fill style={{ objectFit: "contain" }} priority />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              letterSpacing: "0.04em",
              color: brandTitleColor,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            MEMBER PORTAL
          </Typography>
          <Typography variant="caption" sx={{ color: brandSubColor, fontWeight: 700, fontSize: "0.72rem" }}>
            Ledora Platform
          </Typography>
        </Box>
      </Box>

      {/* User Quick Info Tile */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: drawerBorder,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          backgroundColor: isLight ? "rgba(99, 102, 241, 0.03)" : "rgba(255, 255, 255, 0.015)",
          borderRadius: 0,
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            borderRadius: 0,
            bgcolor: "#6366f1",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "0.95rem",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {user?.fullname?.charAt(0).toUpperCase() || "U"}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: brandTitleColor,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: "0.875rem",
            }}
          >
            {user?.fullname || "Member"}
          </Typography>
          <Typography variant="caption" sx={{ color: itemTextColor, display: "block", fontFamily: "monospace" }}>
            @{user?.username || "user"}
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu Items */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1.5, px: 1.5 }}>
        <List disablePadding>
          {menuConfig.map((item) => {
            const hasSub = !!item.subItems;
            const isSubOpen = !!openSubmenus[item.key];
            const isParentActive =
              item.href === pathname ||
              (hasSub && item.subItems.some((s) => pathname.startsWith(s.href)));

            return (
              <Box key={item.label} sx={{ mb: 0.5 }}>
                {hasSub ? (
                  <>
                    <ListItemButton
                      onClick={() => handleSubmenuToggle(item.key)}
                      sx={{
                        borderRadius: 0,
                        py: 1.1,
                        px: 1.5,
                        color: isParentActive ? "#6366f1" : itemTextColor,
                        backgroundColor: isParentActive
                          ? isLight ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.12)"
                          : "transparent",
                        borderLeft: isParentActive ? "3px solid #6366f1" : "3px solid transparent",
                        "&:hover": {
                          backgroundColor: isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.04)",
                          color: isLight ? "#0f172a" : "#f8fafc",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: isParentActive ? "#6366f1" : itemIconColor, minWidth: 34 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "0.85rem",
                          fontWeight: isParentActive ? 700 : 500,
                        }}
                      />
                      {isSubOpen ? (
                        <ExpandLess sx={{ fontSize: 18, color: itemIconColor }} />
                      ) : (
                        <ExpandMore sx={{ fontSize: 18, color: itemIconColor }} />
                      )}
                    </ListItemButton>

                    <Collapse in={isSubOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 2, mt: 0.5 }}>
                        {item.subItems.map((sub) => {
                          const isCurrent = pathname === sub.href;
                          return (
                            <ListItemButton
                              key={sub.label}
                              component={Link}
                              href={sub.href}
                              onClick={() => isMobile && setMobileOpen(false)}
                              sx={{
                                borderRadius: 0,
                                py: 0.8,
                                px: 1.5,
                                color: isCurrent ? "#6366f1" : itemTextColor,
                                backgroundColor: isCurrent
                                  ? isLight ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.15)"
                                  : "transparent",
                                borderLeft: isCurrent ? "2px solid #6366f1" : "2px solid transparent",
                                "&:hover": {
                                  backgroundColor: isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.04)",
                                  color: isLight ? "#0f172a" : "#f8fafc",
                                },
                              }}
                            >
                              <ListItemIcon sx={{ color: isCurrent ? "#6366f1" : itemIconColor, minWidth: 28 }}>
                                {sub.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={sub.label}
                                primaryTypographyProps={{
                                  fontSize: "0.8rem",
                                  fontWeight: isCurrent ? 700 : 500,
                                }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  </>
                ) : (
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    onClick={() => isMobile && setMobileOpen(false)}
                    sx={{
                      borderRadius: 0,
                      py: 1.1,
                      px: 1.5,
                      color: isParentActive ? "#6366f1" : itemTextColor,
                      backgroundColor: isParentActive
                        ? isLight ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.12)"
                        : "transparent",
                      borderLeft: isParentActive ? "3px solid #6366f1" : "3px solid transparent",
                      "&:hover": {
                        backgroundColor: isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.04)",
                        color: isLight ? "#0f172a" : "#f8fafc",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: isParentActive ? "#6366f1" : itemIconColor, minWidth: 34 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: "0.85rem",
                        fontWeight: isParentActive ? 700 : 500,
                      }}
                    />
                  </ListItemButton>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      {/* Sticky Bottom Actions & Rapidtechpro Attribution */}
      <Box
        sx={{
          p: 2,
          borderTop: drawerBorder,
          backgroundColor: sidebarFooterBg,
          borderRadius: 0,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={handleLogout}
          startIcon={<ExitToApp sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: 0,
            py: 0.9,
            fontSize: "0.8rem",
            fontWeight: 700,
            borderColor: "rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            "&:hover": {
              borderColor: "#ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
            },
          }}
        >
          Sign Out
        </Button>

        <Box sx={{ mt: 1.5, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: footerTextColor, fontSize: "0.72rem" }}>
            Powerd By :{" "}
            <a
              href="https://rapidtechpro.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#6366f1",
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              RAPIDTECHPRO
            </a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: mainBg }}>
      {/* Responsive Drawer Sidebar */}
      <Box
        component="nav"
        sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
        aria-label="User Navigation Menu"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRadius: 0,
              borderRight: drawerBorder,
              backgroundColor: drawerBg,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRadius: 0,
              borderRight: drawerBorder,
              backgroundColor: drawerBg,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Layout Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh",
          backgroundColor: mainBg,
        }}
      >
        {/* Top Navigation Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: appBarBg,
            backdropFilter: "blur(20px)",
            borderBottom: appBarBorder,
            borderRadius: 0,
            color: appBarTitleColor,
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", minHeight: { xs: 60, sm: 68 }, px: { xs: 2, sm: 3 } }}>
            {/* Left Toolbar: Toggle & Page Title */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { lg: "none" }, borderRadius: 0 }}
              >
                <MenuIcon />
              </IconButton>

              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.05rem", sm: "1.25rem" },
                    letterSpacing: "-0.01em",
                    color: appBarTitleColor,
                  }}
                >
                  Member Workspace
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: itemTextColor, display: { xs: "none", sm: "block" }, fontSize: "0.75rem" }}
                >
                  Welcome back, {user?.fullname || "Member"}
                </Typography>
              </Box>
            </Stack>

            {/* Right Toolbar: Theme Switch & Profile Dropdown */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Theme Toggle Button */}
              <Tooltip title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}>
                <Button
                  id="user-theme-switch-btn"
                  onClick={toggleTheme}
                  size="small"
                  variant="outlined"
                  startIcon={
                    isLight ? (
                      <DarkModeOutlined sx={{ fontSize: 18, color: "#4f46e5" }} />
                    ) : (
                      <LightModeOutlined sx={{ fontSize: 18, color: "#fbbf24" }} />
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

              {/* Profile Avatar Popover Menu */}
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{
                  p: 0.5,
                  borderRadius: 0,
                  border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
                  backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.04)",
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 0,
                    background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {user?.fullname?.charAt(0).toUpperCase() || "U"}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: 0,
                    backgroundColor: isLight ? "#ffffff" : "#0d131f",
                    border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.1)",
                    color: brandTitleColor,
                    minWidth: 200,
                    mt: 1.5,
                    boxShadow: isLight ? "0 10px 25px rgba(0,0,0,0.1)" : "0 10px 30px rgba(0,0,0,0.5)",
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: brandTitleColor }}>
                    {user?.fullname || "Member"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: itemTextColor }}>
                    @{user?.username || "user"}
                  </Typography>
                </Box>
                <MenuItem
                  component={Link}
                  href="/user-dashboard/profile"
                  onClick={handleUserMenuClose}
                  sx={{ borderRadius: 0, py: 1, fontSize: "0.875rem", "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.12)" } }}
                >
                  My Profile
                </MenuItem>
                <MenuItem
                  component={Link}
                  href="/user-dashboard/kyc"
                  onClick={handleUserMenuClose}
                  sx={{ borderRadius: 0, py: 1, fontSize: "0.875rem", "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.12)" } }}
                >
                  KYC Verification
                </MenuItem>
                <Divider sx={{ my: 0.5, borderColor: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)" }} />
                <MenuItem
                  onClick={handleLogout}
                  sx={{ borderRadius: 0, py: 1, color: "#f87171", fontSize: "0.875rem", "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.1)" } }}
                >
                  Sign Out
                </MenuItem>
              </Menu>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Main Routed Page Content */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5, md: 3 }, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
          {children}
        </Box>

        {/* Global Mandatory Footer */}
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
            borderRadius: 0,
          }}
        >
          <Typography variant="caption" sx={{ color: footerTextColor, fontSize: "0.75rem" }}>
            © {new Date().getFullYear()} Ledora Global Enterprise. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: footerTextColor, fontSize: "0.75rem" }}>
            Powerd By :{" "}
            <a
              href="https://rapidtechpro.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#6366f1",
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              RAPIDTECHPRO
            </a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function UserDashboardLayout({ children }) {
  return (
    <AppThemeProvider>
      <UserProvider>
        <UserDashboardShell>{children}</UserDashboardShell>
      </UserProvider>
    </AppThemeProvider>
  );
}
