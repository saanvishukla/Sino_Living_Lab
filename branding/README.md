# Module: Branding

This module consists of multiple classes to handle different tasks. The main objective of this model is to take in reference images for branding for a specific building and extract fonts and colorscheme. Then, incrementally, build a 3-dimensional map of the building structure from floor plans. Combining the branding agent with this map results in a final e-directory that can be exported and launched as a static 3D map on microcontrollers to render the map.

### Structure

- **map.py**: This class is responsible for taking floor plans and developing a 3D model.