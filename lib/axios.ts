import axios from "axios";

export const axiosClient = axios.create({
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});
