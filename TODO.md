# To-Do

 * Nightly summaries for assignment owners (email saying who submitted, what they got, who checked out boilerplate, etc)
 * Notifications to students when boilerplates are updated
 * Warnings on push if the student hasn't pulled in changes to the newest boilerplate
 * Show student when they last pulled the boilerplate on the assignment page
 * Support for a solution repository
  * Reference implementation results 
   * Support for multiple branches; e.g. compare solution a,b,c..
   * Use pre-set nonces and cache the values; provide method of retreiving these from boilerplate so students can compare in local test run (e.g. GET /solution/master/?nonce=32CWER32)
  * Automatic publishing of solution after due date has passed
 * Better error reporting
 * Better evaluation security
 * Better notification support
 * Better result/run viewing
 * Automatically import the boilerplate/README.md file as the assignment description
 * Metrics for teachers

 * Comments/discussion on assignments
 * FAQ

# FAQ

# Submission Failures
```git push submit master``` results in ```fatal: 'submit' does not appear to be a git repository fatal: Could not read from remote repository.  Please make sure you have the correct access rights and the repository exists.```

```git push submit master``` results in ```fatal: forbidden```. 

Make sure you've added the correct submission remote; make sure you haven't used the boilerplate or someone else's assignment repository. . Type ```git remote -v``` to show remotes. Make sure it matches what's listed. If you see no submission remote, make sure to add it.


# Run Failures


