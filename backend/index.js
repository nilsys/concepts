const path = require('path')

require('dotenv').config({
  path: path.resolve(__dirname, `./config/${process.env.ENVIRONMENT}.env`)
})

const { prisma } = require('./generated/prisma-client')
const { GraphQLServer } = require('graphql-yoga')
const express = require("express")

const { checkAccess } = require('./accessControl')
const { authenticate } = require('./middleware/authentication')

const queries = require('./resolvers/Query')
const mutations = require('./resolvers/Mutation')

const resolvers = {
  Query: {
    ...queries
  },
  Mutation: {
    ...mutations

    // async deleteCourseAsCoursePrerequisite(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   await context.prisma.updateCourse({
    //     where: { id: args.id },
    //     data: {
    //       prerequisiteCourses: {
    //         disconnect: [{ id: args.prerequisite_id }]
    //       }
    //     }
    //   })
    //   return context.prisma.course({
    //     id: args.prerequisite_id
    //   })
    // },
    // async addCourseAsCoursePrerequisite(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   await context.prisma.updateCourse({
    //     where: { id: args.id },
    //     data: {
    //       prerequisiteCourses: {
    //         connect: [{ id: args.prerequisite_id }]
    //       }
    //     }
    //   })
    //   return context.prisma.course({
    //     id: args.prerequisite_id
    //   })
    // },
    // createResourceWithURLs(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   return context.prisma.createResource({
    //     name: args.name,
    //     description: args.desc,
    //     concept: {
    //       connect: { id: args.concept_id }
    //     },
    //     urls: {
    //       create: args.urls.map(url => {
    //         return { address: url }
    //       })
    //     }
    //   })
    // },
    // createURL(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   return context.prisma.createURL({
    //     address: args.address,
    //     resource: { connect: { id: args.resource_id } }
    //   })
    // },
    // createResource(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   return context.prisma.createResource({
    //     name: args.name,
    //     description: args.desc,
    //     concept: { connect: [{ id: args.concept_id }] }
    //   })
    // },
    // createCourse(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   return context.prisma.createCourse({
    //     name: args.name
    //   })
    // },
    // deleteCourse(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   return context.prisma.deleteCourse({
    //     id: args.id
    //   })
    // },
    // createConcept(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   const concept = args.desc !== undefined
    //     ? args.official !== undefined
    //       ? { name: args.name, description: args.desc, official: args.official }
    //       : { name: args.name, description: args.desc }
    //     : args.official !== undefined
    //       ? { name: args.name, official: args.official }
    //       : { name: args.name }

    //   return context.prisma.createConcept({
    //     ...concept,
    //     courses: { connect: [{ id: args.course_id }] }
    //   })
    // },
    // createConceptAsPrerequisite(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   const concept = args.desc !== undefined
    //     ? args.official !== undefined
    //       ? { name: args.name, description: args.desc, official: args.official }
    //       : { name: args.name, description: args.desc }
    //     : args.official !== undefined
    //       ? { name: args.name, official: args.official }
    //       : { name: args.name }

    //   return context.prisma.createConcept({
    //     ...concept,
    //     asPrerequisite: { connect: [{ id: args.course_id }] }
    //   })
    // },
    // createConceptAsLearningObjective(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   const concept = args.desc !== undefined
    //     ? args.official !== undefined
    //       ? { name: args.name, description: args.desc, official: args.official }
    //       : { name: args.name, description: args.desc }
    //     : args.official !== undefined
    //       ? { name: args.name, official: args.official }
    //       : { name: args.name }

    //   return context.prisma.createConcept({
    //     ...concept,
    //     asLearningObjective: { connect: [{ id: args.course_id }] }
    //   })
    // },
    // updateConcept(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   let data = {}
    //   if (args.name !== undefined) {
    //     data.name = args.name
    //   }
    //   if (args.desc !== undefined) {
    //     data.description = args.desc
    //   }
    //   return context.prisma.updateConcept({
    //     where: { id: args.id },
    //     data: data
    //   })
    // },
    // updateCourse(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   return context.prisma.updateCourse({
    //     where: { id: args.id },
    //     data: { name: args.name }
    //   })
    // },
    // async createConceptAndLinkTo(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   const concept = args.desc !== undefined
    //     ? args.official !== undefined
    //       ? { name: args.name, description: args.desc, official: args.official }
    //       : { name: args.name, description: args.desc }
    //     : args.official !== undefined
    //       ? { name: args.name, official: args.official }
    //       : { name: args.name }
    //   const createdConcept = await context.prisma.createConcept(concept)

    //   // Link created concept to specified concept
    //   return args.linkOfficial !== undefined
    //     ? context.prisma.createLink({
    //       to: { connect: { id: args.to } },
    //       from: { connect: { id: createdConcept.id, } },
    //       official: args.linkOfficial
    //     })
    //     : context.prisma.createLink({
    //       to: { connect: { id: args.to } },
    //       from: { connect: { id: createdConcept.id } }
    //     })
    // },
    // async deleteConcept(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   await context.prisma.deleteManyLinks({

    //     OR: [
    //       {
    //         from: {
    //           id: args.id
    //         }

    //       },
    //       {
    //         to: {
    //           id: args.id
    //         }
    //       }
    //     ]

    //   })
    //   return context.prisma.deleteConcept({
    //     id: args.id
    //   })
    // },
    // createLink(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   return args.official !== undefined
    //     ? context.prisma.createLink({
    //       to: {
    //         connect: { id: args.to }
    //       },
    //       from: {
    //         connect: { id: args.from, }
    //       },
    //       official: args.official
    //     })
    //     : context.prisma.createLink({
    //       to: {
    //         connect: { id: args.to }
    //       },
    //       from: {
    //         connect: { id: args.from }
    //       }
    //     })
    // },
    // deleteLink(root, args, context) {
    //   checkAccess(context, { allowStudent: true })
    //   return context.prisma.deleteLink({
    //     id: args.id
    //   })
    // }
  },
  // Concept: {
  //   linksToConcept(root, args, context) {
  //     return context.prisma.concept({
  //       id: root.id
  //     }).linksToConcept()
  //   },
  //   linksFromConcept(root, args, context) {
  //     return context.prisma.concept({
  //       id: root.id
  //     }).linksFromConcept()
  //   },
  //   courses(root, args, context) {
  //     return context.prisma.concept({
  //       id: root.id
  //     }).courses()
  //   },
  //   asPrerequisite(root, args, context) {
  //     return context.prisma.concept({
  //       id: root.id
  //     }).asPrerequisite()
  //   },
  //   asLearningObjective(root, args, context) {
  //     return context.prisma.concept({
  //       id: root.id
  //     }).asLearningObjective()
  //   },
  //   resources(root, args, context) {
  //     return context.prisma.concept({
  //       id: root.id
  //     }).resources()
  //   }
  // },
  // Link: {
  //   to(root, args, context) {
  //     return context.prisma.link({
  //       id: root.id
  //     }).to()
  //   },
  //   from(root, args, context) {
  //     return context.prisma.link({
  //       id: root.id
  //     }).from()
  //   }
  // },
  // Course: {
  //   concepts(root, args, context) {
  //     return context.prisma.course({
  //       id: root.id
  //     }).concepts()
  //   },
  //   prerequisiteCourses(root, args, context) {
  //     return context.prisma.course({
  //       id: root.id
  //     }).prerequisiteCourses()
  //   }
  // },
  // Resource: {
  //   urls(root, args, context) {
  //     return context.prisma.resource({
  //       id: root.id
  //     }).urls()
  //   }
  // },
  // URL: {
  //   resource(root, args, context) {
  //     return context.prisma.uRL({
  //       id: root.id
  //     }).resource()
  //   }
  // }
  Concept: {
    linksToConcept(root, args, context) {
      return context.prisma.concept({
        id: root.id
      }).linksToConcept()
    },
    linksFromConcept(root, args, context) {
      return context.prisma.concept({
        id: root.id
      }).linksFromConcept()
    },
    courses(root, args, context) {
      return context.prisma.concept({
        id: root.id
      }).courses()
    },
    resources(root, args, context) {
      return context.prisma.concept({
        id: root.id
      }).resources()
    },
    createdBy(root, args, context) {
      return context.prisma.concept({
        id: root.id
      }).createdBy()
    },
  },
  ConceptLink: {
    to(root, args, context) {
      return context.prisma.conceptLink({
        id: root.id
      }).to()
    },
    from(root, args, context) {
      return context.prisma.conceptLink({
        id: root.id
      }).from()
    },
    createdBy(root, args, context) {
      return context.prisma.conceptLink({
        id: root.id
      }).createdBy()
    },
  },
  CourseLink: {
    to(root, args, context) {
      return context.prisma.courseLink({
        id: root.id
      }).to()
    },
    from(root, args, context) {
      return context.prisma.courseLink({
        id: root.id
      }).from()
    },
    createdBy(root, args, context) {
      return context.prisma.courseLink({
        id: root.id
      }).createdBy()
    },
  },
  Course: {
    concepts(root, args, context) {
      return context.prisma.course({
        id: root.id
      }).concepts()
    },
    linksToCourse(root, args, context) {
      return context.prisma.course({
        id: root.id
      }).linksToCourse()
    },
    linksFromCourse(root, args, context) {
      return context.prisma.course({
        id: root.id
      }).linksFromCourse()
    },
    createdBy(root, args, context) {
      return context.prisma.course({
        id: root.id
      }).createdBy()
    },
  },
  Resource: {
    urls(root, args, context) {
      return context.prisma.resource({
        id: root.id
      }).urls()
    }
  },
  URL: {
    resource(root, args, context) {
      return context.prisma.uRL({
        id: root.id
      }).resource()
    }
  }
}

const options = {
  endpoint: '/graphql',
  playground: '/playground',
  port: process.env.PORT || 4000
}

const server = new GraphQLServer({
  typeDefs: './schema.graphql',
  resolvers,
  context: req => ({
    prisma,
    ...req
  }),
  middlewares: [authenticate]
})

if (process.env.ENVIRONMENT === 'production') {
  server.express.use(express.static('../frontend/build'))

  server.express.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/../frontend/build/index.html'))
  })
}

server.start(options, () => console.log(`Server is running on http://localhost:${process.env.PORT || 4000}`))