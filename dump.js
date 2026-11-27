import {
  MAX_MB,
  MAX_FILES,
  MAX_TOTAL_SIZE,
  MAX_TOTAL_MB,
  ALLOWED_EXTENSIONS
} from "../config/uploadConfig.js";



if (!ALLOWED_EXTENSIONS.includes(
    path.extname(file.originalname || "").toLowerCase()
)) {
    throw new Error("Ada file dengan format yang tidak didukung.");
}




import { MAX_MB, MAX_FILES } from "./config/uploadConfig.js";





