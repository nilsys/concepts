import React, { useEffect, useRef } from 'react'
import Course from './Course'
import Typography from '@material-ui/core/Typography'

import Masonry from './Masonry'

import useCreateConceptDialog from './useCreateConceptDialog'
import useEditConceptDialog from './useEditConceptDialog'
import useEditCourseDialog from './useEditCourseDialog'

import { useInfoBox } from '../common/InfoBox'

const GuidedCourseContainer = ({
  courseTrayOpen,
  activeCourse,
  courses,
  activeConceptIds,
  addingLink,
  setAddingLink,
  workspaceId,
  courseId
}) => {

  const infoBox = useInfoBox()

  const connectionRef = useRef()
  const createConceptRef = useRef()

  useEffect(() => {
    if (courses.length === 1 && courses[0].concepts.length === 0) {
      infoBox.open(createConceptRef.current, 'right-start', 'CREATE_CONCEPT_PREREQ', 0, 20)
    } else if (addingLink) {
      infoBox.open(connectionRef.current, 'right-start', 'DRAW_LINK_END', 0, 20)
    }
  }, [infoBox, addingLink, courses])

  const {
    openCreateConceptDialog,
    ConceptCreateDialog
  } = useCreateConceptDialog(activeCourse, workspaceId, true)

  const {
    openEditConceptDialog,
    ConceptEditDialog
  } = useEditConceptDialog(activeCourse, workspaceId)

  const { openEditCourseDialog,
    CourseEditDialog
  } = useEditCourseDialog(workspaceId)

  return <>
    <Typography style={{ gridArea: 'contentHeader', margin: '16px' }} variant='h4'>
      Prerequisites
    </Typography>
    {
      courses && courses.length !== 0 ?
        <div onClick={() => setAddingLink(null)} style={{ gridArea: 'courses', overflowY: 'auto' }}>
          {courses && <Masonry courseTrayOpen={courseTrayOpen}>
            {courses.map((course, index) =>
              <Course
                key={course.id}
                course={course}
                connectionRef={index === 0 ? connectionRef : undefined}
                createConceptRef={(index === 0 && course.concepts.length === 0) ? createConceptRef : undefined}
                activeConceptIds={activeConceptIds}
                addingLink={addingLink}
                setAddingLink={setAddingLink}
                openCourseDialog={openEditCourseDialog}
                openConceptDialog={openCreateConceptDialog}
                openConceptEditDialog={openEditConceptDialog}
                activeCourseId={courseId}
                workspaceId={workspaceId}
              />
            )}
          </Masonry>}
        </div>
        :
        null
    }

    {/* Dialogs */}

    {CourseEditDialog}
    {ConceptCreateDialog}
    {ConceptEditDialog}
  </>
}

export default GuidedCourseContainer
