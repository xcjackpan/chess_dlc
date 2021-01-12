To deploy to ElasticBeanstalk, we want a folder structure of:

root
  -- bin/application
  -- client
  -- firebase_auth.json

_application_ in the bin folder refers to the compiled executable and will be run from the root with the command "./bin/application"