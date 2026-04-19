import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    process.env.NODE_ENV === "development" ? "http://localhost:8000/api/" : "",
  withCredentials: true,
  headers: {
    "Access-Control-Allow-Origin": "http://localhost:3000",
  },
});

