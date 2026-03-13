// Start both monitors here
import 'dotenv/config'

import { main as emailMain } from "./email-monitor/index.js"

emailMain().catch(console.error);