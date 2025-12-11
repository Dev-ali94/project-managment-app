import axios from "axios"
const api = axios.create({
    backend_url:import.meta.env.VITE_BACKEND_URL
})
export default api