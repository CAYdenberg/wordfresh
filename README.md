# WordFresh

Data-rich blogging with Deno and Fresh

## Source

The GitHub repo for this project is used only to publish on Deno.land. Please use the [GitLab repo](https://gitlab.com/lpix/wordfresh) for issues and development.

## Goals

Provides a set of utilites useful for creating a blog with Deno's Fresh.
Includes:

- a database abstraction layer (over CouchDB) to store and retrieve posts,
  images, and other assets.
- utilities to "ingest" posts (in markdown format), images, and other data from
  the filesystem
- model definitions for other schema types
- the ability to encode Islands in markdown, and to direct those islands to
  retrieve data from the database _prior_ to rendering
- a preact hook to retrieve data _post_ render with the same API
- just-in-time image resizing
- a JSONFeed generator
- Search
- OpenGraph, Twitter Card, and other metadata and discoverability tools
- WebMentions

## Definitions

- **Schema** a definition for a Model (created using Zod)
- **Model** a type of record to be stored in the database
- **Record** an instance of a Model. The data in the record is JSON-encoded.
- **File** a special type of record for attachments/binary data rather than
  JSON-encodable data. Files still have JSON-encoded metadata.
- **Post** a type of model representing a blog post.
- **Image** a type of file: usually jpg, png, or bmp.
- **Thumbnail** an image resized to 150px width while retaining the aspect
  ratio.
- **Content** Prose that makes up the body of a Post (or related model). Prose
  is written in Markdown and compiled to Mdast when the Record is ingested.
- **Directive** An extension to markdown that directs WordFresh to use a Fresh
  Island
- **Isoquery** A mechanism isomorphic database queries that can be performed
  from the server or client. Isoqueries are especially useful when combined with
  directives to create Islands that render with default data but can perform
  additional queries from the client when needed.
- **Ingestion** The act of copying data from a file into the database.
