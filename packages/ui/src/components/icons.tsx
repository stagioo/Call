export interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const Icons = {
  logoLight: (props: IconProps) => (
    <svg
      width="500"
      height="500"
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 0H500V500H0V0Z" fill="white" />
      <path d="M218.5 124H347V196H218.5V124Z" fill="#202020" />
      <path d="M153 195H220V296H153V195Z" fill="#202020" />
      <path
        d="M345.035 298L219.015 377L219.015 291L345.035 219.067L345.035 298Z"
        fill="#202020"
      />
    </svg>
  ),
  logoDark: (props: IconProps) => (
    <svg
      width="500"
      height="500"
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 0H500V500H0V0Z" fill="#202020" />
      <path d="M218.5 124H347V196H218.5V124Z" fill="white" />
      <path d="M153 195H220V296H153V195Z" fill="white" />
      <path
        d="M345.035 298L219.015 377L219.015 291L345.035 219.067L345.035 298Z"
        fill="white"
      />
    </svg>
  ),
};
