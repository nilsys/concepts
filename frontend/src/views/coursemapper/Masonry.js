import React from 'react'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  masonry: {
    width: '100%',
    boxSizing: 'border-box',
    columnCount: 1,
    '@media screen and (min-width: 1000px)': {
      columnCount: 2,
      '&.courseTrayOpen': {
        columnCount: 1
      }
    },
    '@media screen and (min-width: 1500px)': {
      columnCount: 3,
      '&.courseTrayOpen': {
        columnCount: 2
      }
    },
    '@media screen and (min-width: 2000px)': {
      columnCount: 4,
      '&.courseTrayOpen': {
        columnCount: 3
      }
    }
  },
  columnWrapper: {
    // These hacks could be replaced with display: inline-block, but then Chrome doesn't wrap the
    // items into many columns nicely. The fix to that is to just use the default display: block,
    // but that causes all browsers to chop our fancy boxes in the middle.

    // This is the standard way to prevent chopping up boxes, but browsers don't support it.
    breakInside: 'avoid-column',
    // This does the same thing, but is chrome-specific.
    columnBreakInside: 'avoid',
    // This magically fixes it for Firefox.
    overflow: 'hidden',
    // Since we don't use inline-block, text-align won't work, so we use flex to center-align.
    display: 'flex',
    justifyContent: 'center'
  }
}))

const Masonry = ({ children, courseTrayOpen }) => {
  const classes = useStyles()
  return (
    <div className={`${classes.masonry} ${courseTrayOpen ? 'courseTrayOpen' : ''}`}>
      {children.map((child, i) => <div className={classes.columnWrapper} key={i}>
        {child}
      </div>)}
    </div>
  )
}

export default Masonry
