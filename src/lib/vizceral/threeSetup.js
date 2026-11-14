import { ColorManagement } from 'three';

// Vizceral's colors and shaders were authored before three.js r152 enabled color management by default.
ColorManagement.enabled = false;
