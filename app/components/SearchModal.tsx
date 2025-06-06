import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Search {
  tenXe: string;
  gia: number;
  namSanXuat: string;
  dongCo: string;
  idLoaiXe: string;
  TenLoai: string;
}

const SearchModal = () => {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState({
    tenXe: "",
    gia: 0,
    namSanXuat: "",
    dongCo: "",
    idLoaiXe: "",
  });
  const [loaiXe, setLoaiXe] = useState<Search[]>([]);

  useEffect(() => {
    fetch("/api/typecar")
      .then((res) => res.json())
      .then((data) => setLoaiXe(data))
      .catch((error) => console.error("Error fetching vehicle types:", error));
  }, []);

  const handleSearch = () => {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (searchParams.tenXe) queryParams.append("tenXe", searchParams.tenXe);
    if (searchParams.gia)
      queryParams.append("gia", searchParams.gia.toString());
    if (searchParams.namSanXuat)
      queryParams.append("namSanXuat", searchParams.namSanXuat);
    if (searchParams.dongCo) queryParams.append("dongCo", searchParams.dongCo);
    if (searchParams.idLoaiXe)
      queryParams.append("idLoaiXe", searchParams.idLoaiXe);

    const dialog = document.getElementById("search_modal") as HTMLDialogElement;
    if (dialog) {
      dialog.close();
    }

    // Navigate to search results page with query parameters
    router.push(`/SearchResult?${queryParams.toString()}`);
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };
  const handleShowModal = () => {
    const dialog = document.getElementById("search_modal") as HTMLDialogElement;
    if (dialog) {
      dialog.showModal();
    }
  };

  return (
    <div className="w-full">
      <div className="gap- 2" onClick={handleShowModal}>
        <Search className="h-6 w-6 text-4xl md:absolute"></Search>
        <div className="hidden md:block md:pl-7">Tìm kiếm xe</div>
      </div>

      <dialog id="search_modal" className="modal">
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>

          <h3 className="font-bold text-lg mb-4">Tìm kiếm xe</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Tên xe</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={searchParams.tenXe}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, tenXe: e.target.value })
                }
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Loại xe</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={searchParams.idLoaiXe}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, idLoaiXe: e.target.value })
                }
              >
                <option value="">Tất cả</option>
                {loaiXe.map((loai) => (
                  <option key={loai.idLoaiXe} value={loai.idLoaiXe}>
                    {loai.TenLoai}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Giá</span>
              </label>
              <input
                type="range"
                min={0}
                max="10000000000"
                step="1000000"
                className="range input-bordered w-full"
                value={searchParams.gia}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    gia: parseInt(e.target.value),
                  })
                }
              />
              <div className="text-center text-gray-500 text-sm mt-1">
                {formatCurrency(searchParams.gia)}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Năm sản xuất</span>
              </label>
              <input
                type="input"
                className="input input-bordered w-full"
                value={searchParams.namSanXuat}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    namSanXuat: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-6">
            <button className="btn btn-primary w-full" onClick={handleSearch}>
              Tìm kiếm
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default SearchModal;
