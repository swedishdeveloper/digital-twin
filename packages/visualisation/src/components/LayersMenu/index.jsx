import * as React from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import LayersIcon from '@mui/icons-material/Layers'
import { FormControlLabel, ListItemText, Switch } from '@mui/material'
import ContentPaste from '@mui/icons-material/ContentPaste'

import { Hail, Info, Map, Person } from '@mui/icons-material'
import RouteIcon from '@mui/icons-material/Route'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'

export default function LayersMenu({
  activeLayers,
  showArcLayer,
  setShowArcLayer,
  showActiveDeliveries,
  setShowActiveDeliveries,
  showAssignedBookings,
  setShowAssignedBookings,
  setShowEditExperimentModal,
  experimentId,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  return (
    <React.Fragment>
      <IconButton
        onClick={handleClick}
        onMouseOver={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <LayersIcon sx={{ width: 32, height: 32 }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
          <ListItemIcon>
            <RouteIcon fontSize="small" />
          </ListItemIcon>
          <FormControlLabel
            control={
              <Switch
                checked={showArcLayer}
                onChange={() => setShowArcLayer((on) => !on)}
              />
            }
            label="Nästa stopp"
          />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <RouteIcon fontSize="small" />
          </ListItemIcon>
          <FormControlLabel
            control={
              <Switch
                checked={showAssignedBookings}
                onChange={() => setShowAssignedBookings((on) => !on)}
              />
            }
            label="Köade bokningar"
          />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <RouteIcon fontSize="small" />
          </ListItemIcon>
          <FormControlLabel
            control={
              <Switch
                checked={showActiveDeliveries}
                onChange={() => setShowActiveDeliveries((on) => !on)}
              />
            }
            label="Pågående leveranser"
          />
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <Map fontSize="small" />
          </ListItemIcon>
          <FormControlLabel
            control={
              <Switch
                checked={activeLayers.municipalityLayer}
                onChange={() => activeLayers.setMunicipalityLayer((on) => !on)}
              />
            }
            label="Kommungränser"
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setShowEditExperimentModal((on) => !on)}>
          <ListItemIcon>
            <ContentPaste fontSize="small" />
          </ListItemIcon>
          <ListItemText>Redigera experiment</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          <ListItemText>Experiment: {experimentId}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <DirectionsCarIcon fontSize="small" />
          </ListItemIcon>
          <FormControlLabel
            control={
              <Switch
                checked={activeLayers.carLayer}
                onChange={() => activeLayers.setCarLayer((on) => !on)}
              />
            }
            label="Visa fordon"
          />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <DirectionsCarIcon fontSize="small" />
          </ListItemIcon>
          <FormControlLabel
            control={
              <Switch
                checked={activeLayers.useIcons}
                onChange={() => activeLayers.setUseIcons((on) => !on)}
              />
            }
            label="Använd ikoner för fordon"
          />
        </MenuItem>
      </Menu>
    </React.Fragment>
  )
}
