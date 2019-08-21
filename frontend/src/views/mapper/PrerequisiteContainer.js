import React, { useEffect, useRef } from 'react'
import { makeStyles } from '@material-ui/core/styles'

import Course from './Course'
import Masonry from './Masonry'
import { useInfoBox } from '../../components/InfoBox'
import DividerWithText from '../../components/DividerWithText'

const useStyles = makeStyles({
  root: {
    gridArea: 'courses',
    overflowY: 'auto',
    marginLeft: '8px'
  }
})

const PrerequisiteContainer = ({
  courseTrayOpen,
  courseLinks,
  courses,
  focusedConceptIds,
  addingLink,
  setAddingLink,
  toggleFocus,
  workspaceId,
  courseId,
  urlPrefix
}) => {
  const classes = useStyles()
  const infoBox = useInfoBox()
  const connectionRef = useRef()
  const createConceptRef = useRef()

  useEffect(() => {
    if (courseLinks.length === 1 && courseLinks[0].from.concepts.length === 0) {
      infoBox.open(createConceptRef.current, 'right-start', 'CREATE_CONCEPT_PREREQ', 0, 20)
    } else if (addingLink) {
      infoBox.open(connectionRef.current, 'right-start', 'DRAW_LINK_END', 0, 20)
    }
  }, [addingLink, courseLinks])

  return <>
    <DividerWithText
      gridArea='contentHeader'
      content='Prerequisites'
      margin='0px 8px 0px 16px'
    />
    {
      courses && courses.length !== 0 ?
        <div onClick={() => setAddingLink(null)} className={classes.root}>
          {courses && <Masonry courseTrayOpen={courseTrayOpen}>
            {courses.map((course, index) =>
              <Course
                key={course.id}
                course={course}
                connectionRef={index === 0 ? connectionRef : undefined}
                createConceptRef={(index === 0 && course.concepts.length === 0)
                  ? createConceptRef : undefined}
                focusedConceptIds={focusedConceptIds}
                addingLink={addingLink}
                setAddingLink={setAddingLink}
                toggleFocus={toggleFocus}
                activeCourseId={courseId}
                workspaceId={workspaceId}
                urlPrefix={urlPrefix}
              />
            )}
          </Masonry>}
        </div>
        :
        null
    }
  </>
}

export default PrerequisiteContainer