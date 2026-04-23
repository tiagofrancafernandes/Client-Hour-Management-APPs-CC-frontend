# 📅 Updated Documentation (simple + short)

## Overview

`DateDisplay` renders a date using:

* user timezone (fallback to browser)
* safe validation
* optional fixed formats (patterns)

---

## Props

| Prop        | Type                                                          | Description                |
| ----------- | ------------------------------------------------------------- | -------------------------- |
| `value`     | `string \| number \| Date`                                    | Date input                 |
| `timezone`  | `string`                                                      | Optional timezone override |
| `locale`    | `string`                                                      | Default: `"en-US"`         |
| `dateStyle` | `"full" \| "long" \| "medium" \| "short"`                     | Default: `"short"`         |
| `timeStyle` | `"full" \| "long" \| "medium" \| "short"`                     | Default: `"medium"`        |
| `format`    | `Intl.DateTimeFormatOptions`                                  | Custom Intl format         |
| `pattern`   | `"iso-date" \| "br-date" \| "datetime" \| "datetime-seconds"` | Fixed format               |

---

## Behavior

* Invalid input → renders nothing
* Timezone priority:

  1. `props.timezone`
  2. user timezone
  3. browser timezone
* Safe fallback using `try/catch`

---

## Examples

### Basic

```vue
<DateDisplay :value="date" />
```

---

### ISO format (YYYY-MM-DD)

```vue
<DateDisplay :value="date" pattern="iso-date" />
```

---

### Brazilian format (DD/MM/YYYY)

```vue
<DateDisplay :value="date" pattern="br-date" />
```

---

### Date + time

```vue
<DateDisplay :value="date" pattern="datetime" />
```

---

### Date + time + seconds

```vue
<DateDisplay :value="date" pattern="datetime-seconds" />
```

---

### Custom Intl format

```vue
<DateDisplay
  :value="date"
  :format="{
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }"
/>
```

---

### Custom timezone

```vue
<DateDisplay
  :value="date"
  timezone="America/New_York"
/>
```

---

## Notes

* Uses native `Intl` (no external libs)
* Pattern mode = fixed output (good for tables, logs)
* Intl mode = localized output (good for UI)
