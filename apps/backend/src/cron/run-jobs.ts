import { removeInactiveToken } from "./remove-inactive-token";

export const runJobs = () => {
  removeInactiveToken.start();
};
