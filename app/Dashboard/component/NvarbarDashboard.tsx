import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { UserAuth } from "@/app/types/auth";
import NotificationComponent from "@/app/components/Notification";

interface CartItem {
  idGioHang: number;
  idXe: number;
  SoLuong: number;
  xe: {
    TenXe: string;
    GiaXe: number;
    MauSac: string;
    HinhAnh: string;
    TrangThai: string;
  };
}

interface Notification {
  id: number;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbardashboard: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserAuth | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) throw new Error("Failed to fetch session");
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch session", error);
        setUser(null);
      }
    };

    fetchSession();

    // Close notification dropdown when clicking outside
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setCartItems([]); // Clear cart items on logout
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-base-100 border-b z-50 w-full">
      <div className="navbar w-full bg-white">
        <div className="flex-none">
          <button
            className="btn btn-square text-black btn-ghost"
            onClick={onToggleSidebar}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-5 w-5 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
        <div className="flex-1">
          <Link href="/Dashboard" className="btn btn-ghost text-black text-xl">
            Dashboard
          </Link>
        </div>

        {/* Notification Icon and Dropdown */}
        <div>
          <NotificationComponent />
        </div>

        {/* User Avatar Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar flex items-center justify-center"
          >
            <div
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold leading-none"
              style={{ lineHeight: "2.5rem" }}
            >
              {user ? (
                user.Avatar && user.Avatar.length > 0 ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <img
                      src={user.Avatar}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm">
                      {user.Hoten ? user.Hoten.charAt(0).toUpperCase() : "?"}
                    </span>
                  </div>
                )
              ) : (
                // Fallback display when user is null
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-white text-sm">?</span>
                </div>
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <a href="/" className="justify-between">
                Trang chủ
              </a>
            </li>
            <li>
              <a
                href="/dashboard/Changepasswordpage"
                className="justify-between"
              >
                Đổi mật khẩu
              </a>
            </li>
            <li>
              <a href="/Profile" className="justify-between">
                Thông tin cá nhân
              </a>
            </li>
            <li>
              <a onClick={handleLogout}>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbardashboard;
