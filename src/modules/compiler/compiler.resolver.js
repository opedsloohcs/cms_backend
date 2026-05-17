// src/modules/compiler/compiler.resolver.js

import {
    getCompiler,
    getCompilers,
    getAllCompilers,
    createCompilerService,
    updateCompilerService,
    deleteCompilerService,
    toggleCompilerActiveService,
  } from './compiler.service.js';
  
  const compilerResolver = {
    Query: {
      compiler:     (_parent, { id })   => getCompiler(id),
      compilers:    (_parent, args)     => getCompilers(args),
      allCompilers: (_parent, { onlyActive }) => getAllCompilers(onlyActive ?? false),
    },
  
    Mutation: {
      createCompiler:       (_parent, { input })         => createCompilerService(input),
      updateCompiler:       (_parent, { id, input })     => updateCompilerService(id, input),
      deleteCompiler:       (_parent, { id })            => deleteCompilerService(id),
      toggleCompilerActive: (_parent, { id, active })    => toggleCompilerActiveService(id, active),
    },
  
    Compiler: {
      id: (parent) => parent._id?.toString() ?? parent.id,
  
      // Flatten config back out so the GraphQL type sees name/logo/config/…
      // as a single JSON string — lets the frontend receive the full merged object
      // without needing to know about the internal name/config split.
      configJson: (parent) =>
        JSON.stringify({ ...(parent.config ?? {}), name: parent.name, logo: parent.logo }),
    },
  };
  
  export default compilerResolver;