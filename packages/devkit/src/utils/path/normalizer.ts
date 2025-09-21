import path from "path";

const isAbsolutePath = (p: string): boolean => {
  if (path.isAbsolute(p)) {
    return true;
  }

  if (/^[a-zA-Z]:\\/.test(p)) {
    return true;
  }

  if (/^\\\\[^\\\\]+\\[^\\\\]+/.test(p)) {
    return true;
  }
  return false;
};

export const normalizePath = (templatePath: string): string => {
  if (templatePath.startsWith("file://")) {
    const url = new URL(templatePath);
    return decodeURI(url.pathname);
  }

  if (!isAbsolutePath(templatePath)) {
    return path.join(process.cwd(), templatePath);
  }

  return templatePath;
};
