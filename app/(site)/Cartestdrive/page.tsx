"use client";
import { UserAuth } from "@/app/types/auth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Image from "next/image";
import Footer from "@/app/components/Footer";

interface Car {
  idXe: number;
  TenXe: string;
  GiaXe: number;
  HinhAnh: string;
  idLoaiXe: number;
  khachHang: {
    Hoten: string;
    Sdt: string;
    Diachi: string;
  };
}

interface AppointmentFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  notes: string;
}

interface TestDriveScheduleData {
  NgayHen: Date | null;
  GioHen: string;
  DiaDiem: string;
}

const CartTestDrivePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [car, setCar] = useState<Car | null>(null);
  const [user, setUser] = useState<UserAuth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testDriveSchedule, setTestDriveSchedule] =
    useState<TestDriveScheduleData>({
      NgayHen: null,
      GioHen: "",
      DiaDiem: "",
    });
  const [formData, setFormData] = useState<AppointmentFormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    notes: "",
  });

  // Fetch user information
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const sessionData = await response.json();

        if (!sessionData) {
          setUser(null); // Allow non-logged in users to book test drives
        } else {
          setUser(sessionData);
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin người dùng:", err);
      } finally {
        // If car details are not yet loaded, change loading state
        if (!car) setLoading(false);
      }
    };

    fetchUserInfo();
  }, [router, car]);

  // Fetch car details
  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!id) {
        setError("Không tìm thấy mã xe");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/car/${id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.idXe) {
          throw new Error("Không có thông tin xe");
        }

        setCar(data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin xe:", err);
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        setLoading(false);
        toast.error("Không thể tải thông tin xe");
      }
    };

    fetchCarDetails();
  }, [id, router]);

  // Pre-fill user data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.Hoten || "",
        phoneNumber: user.Sdt || "",
        email: user.Email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTestDriveScheduleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTestDriveSchedule((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Format the time to 12-hour format for API
      const formattedTime = testDriveSchedule.GioHen;
      const hour = parseInt(formattedTime.split(":")[0]);
      const minute = formattedTime.split(":")[1];
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;
      const time12h = `${formattedHour}:${minute} ${ampm}`;

      // Submit test drive appointment request
      const appointmentResponse = await fetch("/api/calendartestcar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          TenKhachHang: formData.fullName,
          Sdt: formData.phoneNumber,
          Email: formData.email,
          idXe: car?.idXe,
          idLoaiXe: car?.idLoaiXe,
          NgayHen: testDriveSchedule.NgayHen?.toISOString(),
          GioHen: time12h,
          DiaDiem: testDriveSchedule.DiaDiem,
          NoiDung: formData.notes,
        }),
      });

      if (!appointmentResponse.ok) {
        throw new Error("Không thể tạo lịch hẹn trải nghiệm xe");
      }

      // Show success toast and redirect
      toast.success("Đặt lịch hẹn trải nghiệm xe thành công!");
      router.push("/"); // Redirect to home page or appropriate page
    } catch (error) {
      console.error("Lỗi khi đặt lịch hẹn:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  if (loading)
    return (
      <div
        className="flex justify-center items-center h-screen"
        data-theme="light"
      >
        <span className="loading loading-spinner text-blue-600 loading-lg"></span>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-center">
        <div className="text-2xl font-bold text-red-600">{error}</div>
      </div>
    );

  if (!car)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl font-bold text-gray-800">
          Không tìm thấy thông tin xe
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <div className="flex-1 flex justify-center items-center pt-24 pb-12 px-4 w-full">
        <div
          className="w-full md:w-[900px] lg:w-[1200px]  shadow-xl rounded-lg p-8"
          data-theme="light"
        >
          <h1 className="text-3xl font-bold text-center mb-8">
            Đặt Lịch Trải Nghiệm Xe {car.TenXe}
          </h1>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex justify-center items-center">
              <Image
                src={car.HinhAnh[0]}
                alt="Ảnh xe"
                width={500}
                height={500}
                priority
                className="w-full h-full max-w-[500px] rounded-md"
              />
            </div>
            <div className="flex-1">
              <form className="space-y-6" onSubmit={handleAppointmentSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-medium">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      className="input input-bordered text-black w-full mt-2"
                      placeholder="Nhập họ và tên"
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-medium">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      className="input input-bordered  text-black w-full mt-2"
                      placeholder="Nhập số điện thoại"
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      className="input input-bordered  text-black w-full mt-2"
                      placeholder="Nhập email"
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-medium">
                      Ngày hẹn
                    </label>
                    <DatePicker
                      selected={testDriveSchedule.NgayHen}
                      onChange={(date: Date | null) =>
                        setTestDriveSchedule((prev) => ({
                          ...prev,
                          NgayHen: date,
                        }))
                      }
                      minDate={new Date()}
                      className="input input-bordered  w-full mt-2"
                      placeholderText="Chọn ngày hẹn"
                      dateFormat="dd/MM/yyyy"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-medium">Giờ hẹn</label>
                    <select
                      name="GioHen"
                      value={testDriveSchedule.GioHen}
                      onChange={handleTestDriveScheduleChange}
                      className="input input-bordered  w-full mt-2"
                      required
                    >
                      <option value="">Chọn giờ hẹn</option>
                      <option value="08:30">08:30 AM</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="09:30">09:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="13:30">1:30 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="14:30">2:30 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="15:30">3:30 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="16:30">4:30 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="17:30">5:30 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-medium">
                      Địa điểm trải nghiệm
                    </label>
                    <select
                      name="DiaDiem"
                      value={testDriveSchedule.DiaDiem}
                      onChange={handleTestDriveScheduleChange}
                      className="select select-bordered  text-black w-full mt-2"
                      required
                    >
                      <option value="">Chọn địa điểm</option>
                      <option value="03 Phạm Hùng, Hoà Châu, Cẩm Lệ, Đà Nẵng">
                        03 Phạm Hùng, Hoà Châu, Cẩm Lệ, Đà Nẵng
                      </option>
                      <option value="115 Đ. Nguyễn Văn Linh, Nam Dương, Hải Châu, Đà Nẵng">
                        115 Đ. Nguyễn Văn Linh, Nam Dương, Hải Châu, Đà Nẵng
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium">Ghi chú</label>
                  <textarea
                    name="notes"
                    required
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered  text-black w-full mt-2 h-24"
                    placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt"
                  ></textarea>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => router.push(`/Carcategory?id=${car.idXe}`)}
                    className="btn flex-1 bg-gray-400 hover:bg-gray-500 text-white"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Đặt lịch hẹn
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartTestDrivePage;
